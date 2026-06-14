export type PublicDatasetStatus = "live" | "near_real_time" | "periodic" | "api_key_required" | "configured";

export type PublicDatasetCategory =
  | "earthquakes"
  | "natural_events"
  | "wildfires"
  | "air_quality";

export type PublicDatasetLayer = {
  id: PublicDatasetCategory;
  label: string;
  description: string;
  color: string;
  status: PublicDatasetStatus;
  source: string;
  sourceUrl: string;
  sourceLicense: string;
  confidence: "high" | "medium" | "low";
  liveInApi: boolean;
};

export type PublicDatasetFeature = {
  id: string;
  category: PublicDatasetCategory;
  label: string;
  summary: string;
  longitude: number;
  latitude: number;
  value: string | null;
  observedAt: string | null;
  source: string;
  source_url: string;
  source_license: string;
  imported_at: string;
  confidence: "high" | "medium" | "low";
  unit?: string;
  interpreted_value?: string;
  status_label?: string;
  status_description?: string;
  interpretation_standard?: string;
  technical_details?: Array<{
    label: string;
    value: string;
  }>;
};

export const PUBLIC_DATASET_LAYERS: PublicDatasetLayer[] = [
  {
    id: "earthquakes",
    label: "Gempa Bumi",
    description: "Feed GeoJSON gempa global yang diperbarui rutin oleh USGS.",
    color: "#df5732",
    status: "live",
    source: "USGS Earthquake Hazards Program",
    sourceUrl: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
    sourceLicense: "U.S. public domain / USGS terms",
    confidence: "high",
    liveInApi: true,
  },
  {
    id: "natural_events",
    label: "Kejadian Alam Aktif",
    description: "Event aktif dari NASA EONET, termasuk badai, banjir, longsor, vulkanik, dan kategori alam lain.",
    color: "#2269a8",
    status: "near_real_time",
    source: "NASA EONET",
    sourceUrl: "https://eonet.gsfc.nasa.gov/api/v3/events/geojson",
    sourceLicense: "NASA open data / source-specific terms",
    confidence: "high",
    liveInApi: true,
  },
  {
    id: "wildfires",
    label: "Hotspot & Kebakaran",
    description: "Hotspot NASA FIRMS. Live jika NASA_FIRMS_MAP_KEY tersedia; fallback memakai event wildfire EONET.",
    color: "#ba7517",
    status: "api_key_required",
    source: "NASA FIRMS / NASA EONET",
    sourceUrl: "https://firms.modaps.eosdis.nasa.gov/api/",
    sourceLicense: "NASA FIRMS terms",
    confidence: "high",
    liveInApi: true,
  },
  {
    id: "air_quality",
    label: "Kualitas Udara",
    description: "Lokasi pengukuran kualitas udara OpenAQ. Membutuhkan OPENAQ_API_KEY untuk data live.",
    color: "#7c3aed",
    status: "api_key_required",
    source: "OpenAQ",
    sourceUrl: "https://docs.openaq.org/",
    sourceLicense: "OpenAQ terms and provider-specific licenses",
    confidence: "medium",
    liveInApi: false,
  },
];

export function publicLayerById(id: string) {
  return PUBLIC_DATASET_LAYERS.find((layer) => layer.id === id);
}
