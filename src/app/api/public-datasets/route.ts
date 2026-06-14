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

type OpenAqLatestResult = {
  datetime?: {
    utc?: string;
    local?: string;
  };
  value?: number;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  sensorsId?: number;
  locationsId?: number;
};

type OpenAqLatestResponse = {
  results?: OpenAqLatestResult[];
};

type OpenAqParameterResult = {
  id?: number;
  name?: string;
  units?: string;
  displayName?: string | null;
  description?: string | null;
};

type OpenAqParameterResponse = {
  results?: OpenAqParameterResult[];
};

const OPENAQ_PARAMETERS = [
  { id: 2, fallbackLabel: "PM2.5" },
  { id: 3, fallbackLabel: "PM10" },
  { id: 5, fallbackLabel: "NO2" },
  { id: 6, fallbackLabel: "SO2" },
  { id: 7, fallbackLabel: "O3" },
  { id: 8, fallbackLabel: "CO" },
];

function displayUnit(unit: string | null) {
  if (!unit) return "unit tidak tersedia";
  return unit.replace("ug/m3", "µg/m³").replace("ug/m³", "µg/m³");
}

function normalizedUnit(unit: string | null) {
  return (unit ?? "")
    .replace(/[µμ]/g, "u")
    .replace("³", "3")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function roundedReading(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function airQualityInterpretation(parameter: string, value: number, unit: string | null) {
  const standard = "Kategori konsentrasi ISPU sederhana";
  const categories = [
    { label: "Baik", description: "Kualitas udara masih aman untuk aktivitas umum." },
    { label: "Sedang", description: "Masih dapat diterima, tetapi orang sensitif sebaiknya mengurangi paparan lama." },
    { label: "Tidak sehat", description: "Kelompok sensitif perlu membatasi aktivitas luar ruang." },
    { label: "Sangat tidak sehat", description: "Semua orang sebaiknya mengurangi aktivitas luar ruang." },
    { label: "Berbahaya", description: "Hindari aktivitas luar ruang dan ikuti arahan otoritas setempat." },
  ];

  const indexFor = (thresholds: number[]) => {
    const index = thresholds.findIndex((threshold) => value <= threshold);
    return index === -1 ? categories.length - 1 : index;
  };

  const unitKey = normalizedUnit(unit);
  const isMicrogramPerCubicMeter = unitKey === "ug/m3" || unitKey === "µg/m3";
  if (!isMicrogramPerCubicMeter) {
    return {
      label: "Belum dikategorikan",
      description: "Nilai OpenAQ ditampilkan sebagai pembacaan mentah karena unit dari sumber tidak cocok dengan ambang ISPU sederhana.",
      standard: "Raw OpenAQ reading",
    };
  }

  if (parameter === "PM2.5") {
    const category = categories[indexFor([15.5, 55.4, 150.4, 250.4])];
    return { ...category, standard };
  }

  if (parameter === "PM10") {
    const category = categories[indexFor([50, 150, 350, 420])];
    return { ...category, standard };
  }

  return {
    label: "Belum dikategorikan",
    description: "Nilai OpenAQ ditampilkan sebagai konsentrasi mentah karena konversi kategori memerlukan standar dan satuan yang lebih spesifik.",
    standard: "Raw OpenAQ reading",
  };
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchOpenAqJson<T>(url: string, key: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": key,
    },
    next: { revalidate: 900 },
  });
  if (!response.ok) throw new Error(`OpenAQ: ${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

async function loadOpenAqParameter(parameter: { id: number; fallbackLabel: string }, key: string) {
  try {
    const data = await fetchOpenAqJson<OpenAqParameterResponse>(`https://api.openaq.org/v3/parameters/${parameter.id}`, key);
    const metadata = data.results?.[0];
    return {
      id: parameter.id,
      label: metadata?.displayName || metadata?.name || parameter.fallbackLabel,
      standardLabel: parameter.fallbackLabel,
      unit: metadata?.units ?? null,
    };
  } catch {
    return {
      id: parameter.id,
      label: parameter.fallbackLabel,
      standardLabel: parameter.fallbackLabel,
      unit: null,
    };
  }
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

async function loadOpenAq(importedAt: string): Promise<PublicDatasetFeature[]> {
  const key = process.env.OPENAQ_API_KEY;
  const layer = publicLayerById("air_quality");
  if (!key || !layer) return [];

  const responses = await Promise.allSettled(
    OPENAQ_PARAMETERS.map(async (parameterConfig) => {
      const parameter = await loadOpenAqParameter(parameterConfig, key);
      const url = `https://api.openaq.org/v3/parameters/${parameter.id}/latest?limit=35`;
      const data = await fetchOpenAqJson<OpenAqLatestResponse>(url, key);
      return { parameter, results: data.results ?? [] };
    })
  );

  return responses
    .flatMap((response) => (response.status === "fulfilled" ? response.value.results.map((result) => ({ parameter: response.value.parameter, result })) : []))
    .map(({ parameter, result }): PublicDatasetFeature | null => {
      const latitude = numberValue(result.coordinates?.latitude);
      const longitude = numberValue(result.coordinates?.longitude);
      const value = numberValue(result.value);
      if (latitude === null || longitude === null || value === null) return null;
      const observedAt = result.datetime?.utc ?? result.datetime?.local ?? null;
      const interpretation = airQualityInterpretation(parameter.standardLabel, value, parameter.unit);
      const formattedValue = `${parameter.label}: ${roundedReading(value)} ${displayUnit(parameter.unit)}`;

      return {
        id: `openaq-${parameter.id}-${result.locationsId ?? "loc"}-${result.sensorsId ?? "sensor"}-${observedAt ?? "latest"}`,
        category: "air_quality",
        label: `${parameter.label} ${interpretation.label}`,
        summary: `${formattedValue} - ${interpretation.label}${observedAt ? `, ${new Date(observedAt).toLocaleString("id-ID")}` : ""}`,
        longitude,
        latitude,
        value: `${parameter.label} ${roundedReading(value)}`,
        observedAt,
        source: layer.source,
        source_url: `https://api.openaq.org/v3/parameters/${parameter.id}/latest`,
        source_license: layer.sourceLicense,
        imported_at: importedAt,
        confidence: layer.confidence,
        unit: displayUnit(parameter.unit),
        status_label: interpretation.label,
        status_description: interpretation.description,
        interpretation_standard: interpretation.standard,
      };
    })
    .filter((feature): feature is PublicDatasetFeature => feature !== null)
    .slice(0, 180);
}

export async function GET(request: NextRequest) {
  const importedAt = new Date().toISOString();
  const requested = request.nextUrl.searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const include = (id: string) => !requested.length || requested.includes(id);
  const nasaFirmsConfigured = Boolean(process.env.NASA_FIRMS_MAP_KEY);
  const openAqConfigured = Boolean(process.env.OPENAQ_API_KEY);
  const settled = await Promise.allSettled([
    include("earthquakes") ? loadEarthquakes(importedAt) : Promise.resolve([]),
    include("natural_events") || include("wildfires") ? loadEonet(importedAt) : Promise.resolve([]),
    include("wildfires") ? loadFirms(importedAt) : Promise.resolve([]),
    include("air_quality") ? loadOpenAq(importedAt) : Promise.resolve([]),
  ]);

  const features = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const errors = settled
    .map((result, index) => result.status === "rejected" ? `source-${index}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}` : null)
    .filter(Boolean);
  const layers = PUBLIC_DATASET_LAYERS.map((layer) => {
    if (layer.id === "air_quality" && openAqConfigured) return { ...layer, status: "live" as const, liveInApi: true };
    if (layer.id === "wildfires" && nasaFirmsConfigured) return { ...layer, status: "live" as const };
    return layer;
  });

  return success({
    importedAt,
    layers,
    features,
    errors,
    env: {
      nasaFirmsConfigured,
      openAqConfigured,
    },
  });
}
