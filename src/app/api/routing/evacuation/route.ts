import { NextRequest } from "next/server";
import type { Feature, LineString } from "geojson";
import { errorResponse, success } from "@/lib/response";

type Coordinate = [number, number];

type DestinationInput = {
  id: number;
  name: string;
  coordinates: Coordinate;
};

type OsrmWaypoint = {
  location?: Coordinate;
  name?: string;
  distance?: number;
  hint?: string;
};

type OsrmTableResponse = {
  code?: string;
  message?: string;
  distances?: Array<Array<number | null>>;
  durations?: Array<Array<number | null>>;
  sources?: OsrmWaypoint[];
  destinations?: OsrmWaypoint[];
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: LineString;
};

type OsrmRouteResponse = {
  code?: string;
  message?: string;
  waypoints?: OsrmWaypoint[];
  routes?: OsrmRoute[];
};

type SelectedRoutePair = {
  origin: Coordinate;
  originIndex: number;
  destination: DestinationInput;
  destinationIndex: number;
  tableDistanceM: number;
  tableDurationS: number;
  sourceWaypoint?: OsrmWaypoint;
  destinationWaypoint?: OsrmWaypoint;
};

const MAX_ORIGIN_CANDIDATES = 16;
const MAX_DESTINATIONS = 25;
const ROUTING_TIMEOUT_MS = 15_000;

function isCoordinate(value: unknown): value is Coordinate {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const longitude = Number(value[0]);
  const latitude = Number(value[1]);
  return Number.isFinite(longitude)
    && Number.isFinite(latitude)
    && longitude >= -180
    && longitude <= 180
    && latitude >= -90
    && latitude <= 90;
}

function normalizeCoordinate(value: Coordinate): Coordinate {
  return [Number(value[0]), Number(value[1])];
}

function parseDestination(value: unknown): DestinationInput | null {
  if (!value || typeof value !== "object") return null;
  const item = value as { id?: unknown; name?: unknown; coordinates?: unknown };
  const id = Number(item.id);
  if (!Number.isInteger(id) || !isCoordinate(item.coordinates)) return null;

  return {
    id,
    name: String(item.name ?? `Titik ${id}`),
    coordinates: normalizeCoordinate(item.coordinates),
  };
}

function uniqueCoordinates(values: unknown[], limit: number) {
  const coordinates: Coordinate[] = [];
  const keys = new Set<string>();

  for (const value of values) {
    if (!isCoordinate(value)) continue;
    const coordinate = normalizeCoordinate(value);
    const key = `${coordinate[0].toFixed(7)},${coordinate[1].toFixed(7)}`;
    if (keys.has(key)) continue;
    keys.add(key);
    coordinates.push(coordinate);
    if (coordinates.length >= limit) break;
  }

  return coordinates;
}

function coordinatePath(coordinates: Coordinate[]) {
  return coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(";");
}

async function fetchOsrm<T>(url: URL): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTING_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SIGMANTA-WebGIS/1.1",
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM merespons HTTP ${response.status}.`);
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function selectFastestRoutePair(
  osrmBaseUrl: string,
  origins: Coordinate[],
  destinations: DestinationInput[],
): Promise<SelectedRoutePair> {
  const coordinates = [...origins, ...destinations.map((destination) => destination.coordinates)];
  const destinationOffset = origins.length;
  const url = new URL(`${osrmBaseUrl}/table/v1/driving/${coordinatePath(coordinates)}`);

  url.searchParams.set("sources", origins.map((_, index) => String(index)).join(";"));
  url.searchParams.set(
    "destinations",
    destinations.map((_, index) => String(destinationOffset + index)).join(";"),
  );
  url.searchParams.set("annotations", "distance,duration");

  const table = await fetchOsrm<OsrmTableResponse>(url);
  if (table.code !== "Ok") {
    throw new Error(table.message || "OSRM gagal membuat matriks rute jalan.");
  }

  let best: SelectedRoutePair | null = null;

  origins.forEach((origin, originIndex) => {
    destinations.forEach((destination, destinationIndex) => {
      const duration = table.durations?.[originIndex]?.[destinationIndex];
      const distance = table.distances?.[originIndex]?.[destinationIndex];

      // Optional chaining dapat menghasilkan undefined ketika respons OSRM
      // tidak memiliki sel matriks tertentu. Pastikan keduanya benar-benar
      // bertipe number sebelum dimasukkan ke SelectedRoutePair.
      if (typeof duration !== "number" || typeof distance !== "number") return;
      if (!Number.isFinite(duration) || !Number.isFinite(distance)) return;

      const candidate: SelectedRoutePair = {
        origin,
        originIndex,
        destination,
        destinationIndex,
        tableDistanceM: distance,
        tableDurationS: duration,
        sourceWaypoint: table.sources?.[originIndex],
        destinationWaypoint: table.destinations?.[destinationIndex],
      };

      if (
        !best
        || candidate.tableDurationS < best.tableDurationS
        || (
          Math.abs(candidate.tableDurationS - best.tableDurationS) < 1
          && candidate.tableDistanceM < best.tableDistanceM
        )
      ) {
        best = candidate;
      }
    });
  });

  if (!best) {
    throw new Error("Tidak ada kombinasi titik akses dan titik evakuasi yang dapat dijangkau melalui jalan.");
  }

  return best;
}

function chooseFastestAlternative(routes: OsrmRoute[] | undefined) {
  return (routes ?? [])
    .filter((route) => (
      Number.isFinite(route.distance)
      && Number.isFinite(route.duration)
      && route.geometry?.type === "LineString"
    ))
    .sort((left, right) => left.duration - right.duration || left.distance - right.distance)[0] ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    origin?: unknown;
    originCandidates?: unknown;
    targetId?: unknown;
    destinations?: unknown;
  } | null;

  if (!body || !isCoordinate(body.origin)) {
    return errorResponse("Koordinat referensi zona rawan tidak valid.", 422);
  }

  const suppliedOriginCandidates = Array.isArray(body.originCandidates)
    ? body.originCandidates
    : [];
  const origins = uniqueCoordinates(
    suppliedOriginCandidates.length ? suppliedOriginCandidates : [body.origin],
    MAX_ORIGIN_CANDIDATES,
  );

  if (!origins.length) {
    return errorResponse("Titik akses zona rawan tidak valid.", 422);
  }

  if (!Array.isArray(body.destinations)) {
    return errorResponse("Daftar titik evakuasi tidak valid.", 422);
  }

  const allDestinations = body.destinations
    .map(parseDestination)
    .filter((destination): destination is DestinationInput => destination !== null)
    .slice(0, MAX_DESTINATIONS);

  if (!allDestinations.length) {
    return errorResponse("Belum ada titik evakuasi valid untuk dihitung.", 422);
  }

  const requestedTargetId = body.targetId === null || body.targetId === undefined
    ? null
    : Number(body.targetId);

  if (requestedTargetId !== null && !Number.isInteger(requestedTargetId)) {
    return errorResponse("ID titik evakuasi tidak valid.", 422);
  }

  const destinations = requestedTargetId === null
    ? allDestinations
    : allDestinations.filter((destination) => destination.id === requestedTargetId);

  if (!destinations.length) {
    return errorResponse("Titik evakuasi yang dipilih tidak ditemukan.", 404);
  }

  const osrmBaseUrl = (process.env.OSRM_BASE_URL || "https://router.project-osrm.org").replace(/\/+$/, "");

  try {
    const selection = await selectFastestRoutePair(osrmBaseUrl, origins, destinations);
    const url = new URL(
      `${osrmBaseUrl}/route/v1/driving/${coordinatePath([selection.origin, selection.destination.coordinates])}`,
    );

    url.searchParams.set("alternatives", "3");
    url.searchParams.set("steps", "false");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("approaches", "unrestricted;unrestricted");
    url.searchParams.set("continue_straight", "false");

    const sourceHint = selection.sourceWaypoint?.hint;
    const destinationHint = selection.destinationWaypoint?.hint;
    if (sourceHint && destinationHint) {
      url.searchParams.set("hints", `${sourceHint};${destinationHint}`);
    }

    const routeResponse = await fetchOsrm<OsrmRouteResponse>(url);
    const route = chooseFastestAlternative(routeResponse.routes);

    if (routeResponse.code !== "Ok" || !route) {
      return errorResponse(routeResponse.message || "Rute jalan menuju titik evakuasi tidak ditemukan.", 404);
    }

    const geometry: Feature<LineString> = {
      type: "Feature",
      properties: {
        source: "OSRM/OpenStreetMap",
        selectionMode: "fastest-access-point",
        targetId: selection.destination.id,
        targetName: selection.destination.name,
        originCandidateIndex: selection.originIndex,
      },
      geometry: route.geometry,
    };

    return success({
      route: {
        targetId: selection.destination.id,
        targetName: selection.destination.name,
        distanceM: route.distance,
        durationS: route.duration,
        geometry,
        selectedOrigin: selection.origin,
        originCandidateIndex: selection.originIndex,
        snappedOrigin: routeResponse.waypoints?.[0]?.location
          ?? selection.sourceWaypoint?.location
          ?? selection.origin,
        snappedDestination: routeResponse.waypoints?.[1]?.location
          ?? selection.destinationWaypoint?.location
          ?? selection.destination.coordinates,
        originSnapDistanceM: routeResponse.waypoints?.[0]?.distance
          ?? selection.sourceWaypoint?.distance
          ?? null,
        destinationSnapDistanceM: routeResponse.waypoints?.[1]?.distance
          ?? selection.destinationWaypoint?.distance
          ?? null,
        alternativesEvaluated: routeResponse.routes?.length ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan routing jalan gagal dijalankan.";
    return errorResponse(message, 502);
  }
}
