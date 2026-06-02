export const DEFAULT_RISK_LEVELS = [
  { name: "Aman", code: "safe", color: "#22c55e", score: 1 },
  { name: "Rendah", code: "low", color: "#84cc16", score: 2 },
  { name: "Sedang", code: "medium", color: "#eab308", score: 3 },
  { name: "Tinggi", code: "high", color: "#f97316", score: 4 },
  { name: "Ekstrem", code: "extreme", color: "#dc2626", score: 5 },
];

export const DEFAULT_LAYERS = [
  { name: "Segmentasi Lahan", layerType: "land_segmentation", renderType: "primary", displayOrder: 1 },
  { name: "Zona Rawan Bencana", layerType: "disaster_risk", renderType: "primary", displayOrder: 2 },
  { name: "Elevasi", layerType: "elevation", renderType: "primary", displayOrder: 3 },
  { name: "Marker dan Label", layerType: "marker_label", renderType: "overlay", displayOrder: 4 },
  { name: "Jalur Evakuasi", layerType: "evacuation_route", renderType: "overlay", displayOrder: 5 },
  { name: "Titik Mitigasi", layerType: "mitigation_resource", renderType: "overlay", displayOrder: 6 },
] as const;

export const DEFAULT_CATEGORIES = {
  land_segmentation: ["Pertanian", "Perkebunan", "Permukiman", "Lahan Kosong", "Fasilitas Umum", "Hutan", "Industri", "Perairan", "Jalan"],
  disaster_risk: ["Banjir", "Longsor", "Kebakaran Hutan/Lahan", "Gempa Bumi", "Tsunami", "Kekeringan", "Abrasi", "Erupsi Gunung Api", "Angin Puting Beliung"],
  marker_label: ["Tempat Ibadah", "Sekolah", "Puskesmas", "Kantor Desa", "Jembatan"],
  mitigation_resource: ["Posko", "Titik Kumpul", "Gudang Logistik", "Alat Berat", "Sumber Air"],
  evacuation_route: ["Jalur Utama", "Jalur Alternatif", "Jalur Bantuan"],
  elevation: ["Dataran Rendah", "Dataran Sedang", "Dataran Tinggi"],
} as const;
