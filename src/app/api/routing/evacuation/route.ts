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
};

type OsrmTableResponse = {
  code?: string;
  message?: string;
  distances?: Array<Array<number | null>>;
  durations?: Array<Array<number | null>>;
};

type OsrmRouteResponse = {
  code?: string;
  message?: string;
  waypoints?: OsrmWaypoint[];
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: LineString;
  }>;
};

const MAX_CANDIDATES = 25;
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

function parseDestination(value: unknown): DestinationInput | null {
  if (!value || typeof value !== "object") return null;
  const item = value as { id?: unknown; name?: unknown; coordinates?: unknown };
  const id = Number(item.id);
  if (!Number.isInteger(id) || !isCoordinate(item.coordinates)) return null;

  return {
    id,
    name: String(item.name ?? `Titik ${id}`),
    coordinates: [Number(item.coordinates[0]), Number(item.coordinates[1])],
  };
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
        "User-Agent": "SIGMANTA-WebGIS/1.0",
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

async function selectNearestRoadDestination(
  osrmBaseUrl: string,
  origin: Coordinate,
  destinations: DestinationInput[],
) {
  if (destinations.length === 1) return destinations[0];

  const coordinates = [origin, ...destinations.map((destination) => destination.coordinates)];
  const url = new URL(`${osrmBaseUrl}/table/v1/driving/${coordinatePath(coordinates)}`);
  url.searchParams.set("sources", "0");
  url.searchParams.set("destinations", destinations.map((_, index) => String(index + 1)).join(";"));
  url.searchParams.set("annotations", "distance,duration");

  const table = await fetchOsrm<OsrmTableResponse>(url);
  if (table.code !== "Ok") {
    throw new Error(table.message || "OSRM gagal membuat matriks jarak jalan.");
  }

  const roadDistances = table.distances?.[0] ?? [];
  let selectedIndex = -1;
  let shortestDistance = Number.POSITIVE_INFINITY;

  roadDistances.forEach((distance, index) => {
    if (distance !== null && Number.isFinite(distance) && distance < shortestDistance) {
      shortestDistance = distance;
      selectedIndex = index;
    }
  });

  if (selectedIndex < 0) {
    throw new Error("Tidak ada titik evakuasi yang dapat dijangkau melalui jaringan jalan.");
  }

  return destinations[selectedIndex];
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    origin?: unknown;
    targetId?: unknown;
    destinations?: unknown;
  } | null;

  if (!body || !isCoordinate(body.origin)) {
    return errorResponse("Koordinat asal tidak valid.", 422);
  }

  if (!Array.isArray(body.destinations)) {
    return errorResponse("Daftar titik evakuasi tidak valid.", 422);
  }

  const destinations = body.destinations
    .map(parseDestination)
    .filter((destination): destination is DestinationInput => destination !== null)
    .slice(0, MAX_CANDIDATES);

  if (!destinations.length) {
    return errorResponse("Belum ada titik evakuasi valid untuk dihitung.", 422);
  }

  const requestedTargetId = body.targetId === null || body.targetId === undefined
    ? null
    : Number(body.targetId);

  if (requestedTargetId !== null && !Number.isInteger(requestedTargetId)) {
    return errorResponse("ID titik evakuasi tidak valid.", 422);
  }

  const osrmBaseUrl = (process.env.OSRM_BASE_URL || "https://router.project-osrm.org").replace(/\/+$/, "");

  try {
    const selectedDestination = requestedTargetId === null
      ? await selectNearestRoadDestination(osrmBaseUrl, body.origin, destinations)
      : destinations.find((destination) => destination.id === requestedTargetId);

    if (!selectedDestination) {
      return errorResponse("Titik evakuasi yang dipilih tidak ditemukan.", 404);
    }

    const url = new URL(`${osrmBaseUrl}/route/v1/driving/${coordinatePath([body.origin, selectedDestination.coordinates])}`);
    url.searchParams.set("alternatives", "false");
    url.searchParams.set("steps", "false");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");

    const routeResponse = await fetchOsrm<OsrmRouteResponse>(url);
    const route = routeResponse.routes?.[0];

    if (
      routeResponse.code !== "Ok"
      || !route
      || !Number.isFinite(route.distance)
      || !Number.isFinite(route.duration)
      || route.geometry?.type !== "LineString"
    ) {
      return errorResponse(routeResponse.message || "Rute jalan menuju titik evakuasi tidak ditemukan.", 404);
    }

    const geometry: Feature<LineString> = {
      type: "Feature",
      properties: {
        source: "OSRM/OpenStreetMap",
        targetId: selectedDestination.id,
        targetName: selectedDestination.name,
      },
      geometry: route.geometry,
    };

    return success({
      route: {
        targetId: selectedDestination.id,
        targetName: selectedDestination.name,
        distanceM: route.distance,
        durationS: route.duration,
        geometry,
        snappedOrigin: routeResponse.waypoints?.[0]?.location ?? body.origin,
        snappedDestination: routeResponse.waypoints?.[1]?.location ?? selectedDestination.coordinates,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan routing jalan gagal dijalankan.";
    return errorResponse(message, 502);
  }
}
