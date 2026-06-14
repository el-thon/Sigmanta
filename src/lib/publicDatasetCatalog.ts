export type PublicDatasetStatus = "live" | "near_real_time" | "periodic" | "api_key_required" | "configured";

export type PublicDatasetCategory =
  | "earthquakes"
  | "natural_events"
  | "wildfires"
  | "air_quality"
  | "deforestation"
  | "mining"
  | "pollution"
  | "elevation"
  | "boundaries";

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
  {
    id: "deforestation",
    label: "Deforestasi",
    description: "Layer referensi Global Forest Change / Global Forest Watch untuk tree-cover loss dan alert deforestasi.",
    color: "#2f740f",
    status: "periodic",
    source: "Hansen/UMD/Google/USGS/NASA via Google Earth Engine",
    sourceUrl: "https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2024_v1_12",
    sourceLicense: "CC-BY-4.0",
    confidence: "medium",
    liveInApi: false,
  },
  {
    id: "mining",
    label: "Penambangan",
    description: "Layer referensi area tambang/konsesi ekstraktif dari dataset publik yang perlu dikonfigurasi per sumber.",
    color: "#6b7280",
    status: "configured",
    source: "Public mining datasets / national cadastre / Global Forest Watch where available",
    sourceUrl: "https://www.globalforestwatch.org/",
    sourceLicense: "Source-specific terms",
    confidence: "medium",
    liveInApi: false,
  },
  {
    id: "pollution",
    label: "Wilayah Tercemar",
    description: "Kategori payung untuk polusi udara, air, dan tanah; data live awal memakai OpenAQ untuk udara jika API key tersedia.",
    color: "#111827",
    status: "configured",
    source: "OpenAQ and source-specific public pollution datasets",
    sourceUrl: "https://docs.openaq.org/",
    sourceLicense: "Source-specific terms",
    confidence: "low",
    liveInApi: false,
  },
  {
    id: "elevation",
    label: "Elevasi & Terrain",
    description: "Layer terrain/DEM publik untuk konteks topografi pada Cesium dan analisis elevasi lanjutan.",
    color: "#8b5a2b",
    status: "configured",
    source: "Cesium World Terrain / public DEM sources",
    sourceUrl: "https://cesium.com/platform/cesium-ion/content/cesium-world-terrain/",
    sourceLicense: "Provider-specific terms",
    confidence: "medium",
    liveInApi: false,
  },
  {
    id: "boundaries",
    label: "Boundary Publik",
    description: "Boundary administratif dan OSM untuk konteks lokasi dan import area.",
    color: "#0f766e",
    status: "configured",
    source: "OpenStreetMap, geoBoundaries, GADM, or government datasets",
    sourceUrl: "https://www.openstreetmap.org/copyright",
    sourceLicense: "ODbL / source-specific terms",
    confidence: "medium",
    liveInApi: false,
  },
];

export function publicLayerById(id: string) {
  return PUBLIC_DATASET_LAYERS.find((layer) => layer.id === id);
}
