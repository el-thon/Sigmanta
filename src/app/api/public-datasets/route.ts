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

const AIR_QUALITY_CATEGORIES = [
  { label: "Baik", description: "Kualitas udara masih aman untuk aktivitas umum." },
  { label: "Sedang", description: "Masih dapat diterima, tetapi orang sensitif sebaiknya mengurangi paparan lama." },
  { label: "Tidak sehat", description: "Kelompok sensitif perlu membatasi aktivitas luar ruang." },
  { label: "Sangat tidak sehat", description: "Semua orang sebaiknya mengurangi aktivitas luar ruang." },
  { label: "Berbahaya", description: "Hindari aktivitas luar ruang dan ikuti arahan otoritas setempat." },
];

const ISPU_BREAKPOINTS_UG_M3: Record<string, number[]> = {
  "PM2.5": [15.5, 55.4, 150.4, 250.4],
  PM10: [50, 150, 350, 420],
  SO2: [52, 180, 400, 800],
  CO: [4000, 8000, 15000, 30000],
  O3: [120, 235, 400, 800],
  NO2: [80, 200, 1130, 2260],
};

const GAS_MOLECULAR_WEIGHTS: Record<string, number> = {
  SO2: 64.066,
  CO: 28.01,
  O3: 48,
  NO2: 46.0055,
};

function microgramsPerCubicMeter(parameter: string, value: number, unit: string | null) {
  const unitKey = normalizedUnit(unit);
  if (unitKey === "ug/m3") return value;
  if (unitKey === "mg/m3") return value * 1000;

  const molecularWeight = GAS_MOLECULAR_WEIGHTS[parameter];
  if (!molecularWeight) return null;
  if (unitKey === "ppm") return value * molecularWeight * 1000 / 24.45;
  if (unitKey === "ppb") return value * molecularWeight / 24.45;
  return null;
}

function airQualityInterpretation(parameter: string, value: number, unit: string | null) {
  const standard = "Kategori konsentrasi ISPU sederhana";
  const breakpoints = ISPU_BREAKPOINTS_UG_M3[parameter];
  if (!breakpoints) {
    return {
      label: "Belum dikategorikan",
      description: "Nilai OpenAQ ditampilkan sebagai pembacaan mentah karena parameter belum memiliki ambang interpretasi.",
      standard: "Raw OpenAQ reading",
      interpretedValue: null,
    };
  }

  const interpretedValue = microgramsPerCubicMeter(parameter, value, unit);
  if (interpretedValue === null) {
    return {
      label: "Belum dikategorikan",
      description: "Nilai OpenAQ ditampilkan sebagai pembacaan mentah karena unit dari sumber tidak cocok dengan ambang ISPU sederhana.",
      standard: "Raw OpenAQ reading",
      interpretedValue: null,
    };
  }

  const categoryIndex = breakpoints.findIndex((threshold) => interpretedValue <= threshold);
  const category = AIR_QUALITY_CATEGORIES[categoryIndex === -1 ? AIR_QUALITY_CATEGORIES.length - 1 : categoryIndex];
  const convertedDescription = normalizedUnit(unit) === "ug/m3"
    ? category.description
    : `${category.description} Nilai dikonversi ke µg/m³ untuk pembacaan kategori.`;
  return { ...category, description: convertedDescription, standard, interpretedValue };
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

function compactDetails(details: Array<{ label: string; value: string | number | null | undefined }>) {
  return details
    .filter((detail) => detail.value !== null && detail.value !== undefined && String(detail.value).trim() !== "")
    .map((detail) => ({ label: detail.label, value: String(detail.value) }));
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
      const updated = numberValue(properties.updated);
      const depth = Array.isArray(feature.geometry?.coordinates) ? numberValue(feature.geometry.coordinates[2]) : null;
      const place = String(properties.place ?? "Gempa bumi");
      const url = String(properties.url ?? layer.sourceUrl);
      const tsunami = numberValue(properties.tsunami);
      const felt = numberValue(properties.felt);
      const sig = numberValue(properties.sig);
      const gap = numberValue(properties.gap);
      const rms = numberValue(properties.rms);

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
        status_label: mag === null ? "Magnitude tidak tersedia" : `Magnitude ${mag}`,
        status_description: depth === null
          ? "Data gempa dari USGS. Kedalaman tidak tersedia pada titik ini."
          : `Gempa tercatat pada kedalaman sekitar ${roundedReading(depth)} km.`,
        interpretation_standard: "USGS Earthquake GeoJSON feed",
        technical_details: compactDetails([
          { label: "Magnitude", value: mag === null ? null : `M ${mag}` },
          { label: "Kedalaman", value: depth === null ? null : `${roundedReading(depth)} km` },
          { label: "Waktu kejadian", value: time ? new Date(time).toLocaleString("id-ID") : null },
          { label: "Update USGS", value: updated ? new Date(updated).toLocaleString("id-ID") : null },
          { label: "Jenis magnitude", value: properties.magType ? String(properties.magType) : null },
          { label: "Status review", value: properties.status ? String(properties.status) : null },
          { label: "Tsunami flag", value: tsunami === null ? null : tsunami === 1 ? "Ya" : "Tidak" },
          { label: "Laporan dirasakan", value: felt },
          { label: "Significance", value: sig },
          { label: "Azimuthal gap", value: gap === null ? null : `${roundedReading(gap)}°` },
          { label: "RMS residual", value: rms },
        ]),
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
      const categoryTitle = categories
        .map((category) => (category && typeof category === "object" && "title" in category ? String((category as { title?: unknown }).title) : ""))
        .find(Boolean);
      const category = primaryCategory === "wildfires" ? "wildfires" : "natural_events";
      const categoryLayer = publicLayerById(category) ?? layer;
      const date = typeof properties.date === "string" ? properties.date : null;
      const sourceUrl = typeof properties.link === "string" ? properties.link : categoryLayer.sourceUrl;
      const source = typeof properties.sources === "string" ? properties.sources : null;

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
        status_label: category === "wildfires" ? "Event wildfire aktif" : "Kejadian alam aktif",
        status_description: date
          ? `Event masih berstatus aktif di NASA EONET dan terakhir tercatat pada ${new Date(date).toLocaleString("id-ID")}.`
          : "Event masih berstatus aktif di NASA EONET.",
        interpretation_standard: "NASA EONET open event status",
        technical_details: compactDetails([
          { label: "Kategori EONET", value: categoryTitle ?? primaryCategory },
          { label: "ID kategori", value: primaryCategory },
          { label: "Tanggal event", value: date ? new Date(date).toLocaleString("id-ID") : null },
          { label: "Longitude", value: roundedReading(coordinates.longitude) },
          { label: "Latitude", value: roundedReading(coordinates.latitude) },
          { label: "Sumber event", value: source },
          { label: "Status", value: "Open / aktif" },
        ]),
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
      const brightness = row.bright_ti4 ?? row.brightness ?? null;
      return {
        id: `firms-${row.latitude}-${row.longitude}-${row.acq_date}-${index}`,
        category: "wildfires",
        label: "VIIRS active fire hotspot",
        summary: `Brightness ${brightness ?? "-"}, confidence ${row.confidence ?? "-"}`,
        longitude,
        latitude,
        value: row.confidence ? `Conf ${row.confidence}` : null,
        observedAt,
        source: "NASA FIRMS VIIRS S-NPP NRT",
        source_url: layer.sourceUrl,
        source_license: layer.sourceLicense,
        imported_at: importedAt,
        confidence: "high",
        status_label: "Hotspot satelit aktif",
        status_description: "Titik ini adalah deteksi panas aktif dari satelit NASA FIRMS. Ini menandakan anomali panas, bukan selalu kebakaran terverifikasi di lapangan.",
        interpretation_standard: "NASA FIRMS active fire detection",
        technical_details: compactDetails([
          { label: "Brightness", value: brightness },
          { label: "Confidence satelit", value: row.confidence },
          { label: "FRP", value: row.frp ? `${row.frp} MW` : null },
          { label: "Satelit", value: row.satellite },
          { label: "Instrumen", value: row.instrument },
          { label: "Waktu akuisisi", value: observedAt ? new Date(observedAt).toLocaleString("id-ID") : null },
          { label: "Day/night", value: row.daynight },
          { label: "Scan", value: row.scan },
          { label: "Track", value: row.track },
          { label: "Versi data", value: row.version },
        ]),
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
        interpreted_value: interpretation.interpretedValue === null ? undefined : `${roundedReading(interpretation.interpretedValue)} µg/m³`,
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
