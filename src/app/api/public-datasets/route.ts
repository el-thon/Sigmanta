import { NextRequest } from "next/server";
import { PUBLIC_DATASET_LAYERS, PublicDatasetFeature, publicLayerById } from "@/lib/publicDatasetCatalog";
import { success } from "@/lib/response";

type GeoJsonFeature = {
  id?: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type: string;
    coordinates: unknown;
  };
};

type GeoJsonCollection = {
  features?: GeoJsonFeature[];
};

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pointCoordinates(feature: GeoJsonFeature) {
  if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) return null;
  const [longitude, latitude] = feature.geometry.coordinates;
  const lng = numberValue(longitude);
  const lat = numberValue(latitude);
  if (lng === null || lat === null) return null;
  return { longitude: lng, latitude: lat };
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

async function loadEarthquakes(importedAt: string): Promise<PublicDatasetFeature[]> {
  const layer = publicLayerById("earthquakes");
  if (!layer) return [];
  const data = await fetchJson<GeoJsonCollection>("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");

  return (data.features ?? [])
    .map((feature): PublicDatasetFeature | null => {
      const coordinates = pointCoordinates(feature);
      if (!coordinates) return null;
      const properties = feature.properties ?? {};
      const mag = numberValue(properties.mag);
      const time = numberValue(properties.time);
      const place = String(properties.place ?? "Gempa bumi");
      const url = String(properties.url ?? layer.sourceUrl);

      return {
        id: `usgs-${feature.id ?? `${coordinates.longitude}-${coordinates.latitude}`}`,
        category: "earthquakes",
        label: place,
        summary: `Magnitude ${mag ?? "-"}${time ? `, ${new Date(time).toLocaleString("id-ID")}` : ""}`,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        value: mag === null ? null : `M ${mag}`,
        observedAt: time ? new Date(time).toISOString() : null,
        source: layer.source,
        source_url: url,
        source_license: layer.sourceLicense,
        imported_at: importedAt,
        confidence: layer.confidence,
      };
    })
    .filter((feature): feature is PublicDatasetFeature => feature !== null)
    .slice(0, 120);
}

async function loadEonet(importedAt: string): Promise<PublicDatasetFeature[]> {
  const layer = publicLayerById("natural_events");
  if (!layer) return [];
  const url = "https://eonet.gsfc.nasa.gov/api/v3/events/geojson?status=open&days=90&limit=120";
  const data = await fetchJson<GeoJsonCollection>(url);

  return (data.features ?? [])
    .map((feature): PublicDatasetFeature | null => {
      const coordinates = pointCoordinates(feature);
      if (!coordinates) return null;
      const properties = feature.properties ?? {};
      const categories = Array.isArray(properties.categories) ? properties.categories : [];
      const primaryCategory = categories
        .map((category) => (category && typeof category === "object" && "id" in category ? String((category as { id?: unknown }).id) : ""))
        .find(Boolean);
      const category = primaryCategory === "wildfires" ? "wildfires" : "natural_events";
      const categoryLayer = publicLayerById(category) ?? layer;
      const date = typeof properties.date === "string" ? properties.date : null;
      const sourceUrl = typeof properties.link === "string" ? properties.link : categoryLayer.sourceUrl;

      return {
        id: `eonet-${String(feature.id ?? properties.id ?? `${coordinates.longitude}-${coordinates.latitude}`)}`,
        category,
        label: String(properties.title ?? "Kejadian alam aktif"),
        summary: `${primaryCategory || "event"}${date ? `, ${new Date(date).toLocaleDateString("id-ID")}` : ""}`,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        value: primaryCategory || null,
        observedAt: date,
        source: categoryLayer.source,
        source_url: sourceUrl,
        source_license: categoryLayer.sourceLicense,
        imported_at: importedAt,
        confidence: categoryLayer.confidence,
      };
    })
    .filter((feature): feature is PublicDatasetFeature => feature !== null);
}

function csvRows(csv: string) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

async function loadFirms(importedAt: string): Promise<PublicDatasetFeature[]> {
  const key = process.env.NASA_FIRMS_MAP_KEY;
  const layer = publicLayerById("wildfires");
  if (!key || !layer) return [];
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/world/1`;
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) return [];
  const text = await response.text();

  return csvRows(text)
    .map((row, index): PublicDatasetFeature | null => {
      const latitude = numberValue(row.latitude);
      const longitude = numberValue(row.longitude);
      if (latitude === null || longitude === null) return null;
      const observedAt = row.acq_date ? `${row.acq_date}T${String(row.acq_time ?? "0000").padStart(4, "0").slice(0, 2)}:${String(row.acq_time ?? "0000").padStart(4, "0").slice(2, 4)}:00Z` : null;
      return {
        id: `firms-${row.latitude}-${row.longitude}-${row.acq_date}-${index}`,
        category: "wildfires",
        label: "VIIRS active fire hotspot",
        summary: `Brightness ${row.bright_ti4 ?? row.brightness ?? "-"}, confidence ${row.confidence ?? "-"}`,
        longitude,
        latitude,
        value: row.confidence ? `Conf ${row.confidence}` : null,
        observedAt,
        source: "NASA FIRMS VIIRS S-NPP NRT",
        source_url: layer.sourceUrl,
        source_license: layer.sourceLicense,
        imported_at: importedAt,
        confidence: "high",
      };
    })
    .filter((feature): feature is PublicDatasetFeature => feature !== null)
    .slice(0, 150);
}

export async function GET(request: NextRequest) {
  const importedAt = new Date().toISOString();
  const requested = request.nextUrl.searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const include = (id: string) => !requested.length || requested.includes(id);
  const settled = await Promise.allSettled([
    include("earthquakes") ? loadEarthquakes(importedAt) : Promise.resolve([]),
    include("natural_events") || include("wildfires") ? loadEonet(importedAt) : Promise.resolve([]),
    include("wildfires") ? loadFirms(importedAt) : Promise.resolve([]),
  ]);

  const features = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const errors = settled
    .map((result, index) => result.status === "rejected" ? `source-${index}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}` : null)
    .filter(Boolean);

  return success({
    importedAt,
    layers: PUBLIC_DATASET_LAYERS,
    features,
    errors,
    env: {
      nasaFirmsConfigured: Boolean(process.env.NASA_FIRMS_MAP_KEY),
      openAqConfigured: Boolean(process.env.OPENAQ_API_KEY),
    },
  });
}
