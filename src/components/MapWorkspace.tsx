"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Circle as LeafletCircle, GeoJSON as GeoJSONLayer, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import * as turf from "@turf/turf";
import { BarChart3, Circle as CircleIcon, Hexagon, Layers, MapIcon, MapPin, MousePointer2, Plus, Route, Save, Settings, Square, X } from "lucide-react";
import type { Feature } from "geojson";

type LayerType = "land_segmentation" | "disaster_risk" | "elevation" | "marker_label" | "evacuation_route" | "mitigation_resource";
type GeometryType = "point" | "linestring" | "polygon" | "rectangle" | "circle";
type ObjectType = "land_segment" | "disaster_area" | "elevation_area" | "marker" | "route" | "resource_point" | "radius_area";
type ToolKey = "land_polygon" | "land_rectangle" | "disaster_polygon" | "disaster_circle" | "mitigation_marker" | "evacuation_route" | "marker_label";

export type WorkspaceLayer = {
  id: number;
  name: string;
  layerType: LayerType;
  renderType: "primary" | "overlay";
  isVisible: boolean;
  categories: Array<{ id: number; name: string; color: string | null }>;
};

export type WorkspaceRiskLevel = {
  id: number;
  name: string;
  code: string;
  color: string;
  score: number;
};

export type WorkspaceMapObject = {
  id: number;
  projectId: number;
  layerId: number;
  categoryId: number | null;
  riskLevelId: number | null;
  name: string;
  label: string | null;
  objectType: ObjectType;
  geometryType: GeometryType;
  areaSize: number | null;
  lengthSize: number | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  notes: string | null;
  geometry: Feature;
  metadata: unknown;
  styleConfig: unknown;
  createdAt: string;
  updatedAt: string;
};

export type MapWorkspaceProps = {
  projectId: number;
  projectName: string;
  projectLocation?: string;
  center?: [number, number];
  zoom?: number;
  layers: WorkspaceLayer[];
  riskLevels: WorkspaceRiskLevel[];
  initialObjects: WorkspaceMapObject[];
};

type ToolConfig = {
  key: ToolKey;
  label: string;
  hint: string;
  layerType: LayerType;
  objectType: ObjectType;
  geometryType: GeometryType;
  drawShape: "polygon" | "rectangle" | "circle" | "marker" | "polyline";
  icon: typeof Hexagon;
};

type DraftObject = {
  tool: ToolConfig;
  geometry: Feature;
  areaSize: number | null;
  lengthSize: number | null;
  radiusSize: number | null;
  latitude: number | null;
  longitude: number | null;
};

const tools: ToolConfig[] = [
  {
    key: "land_polygon",
    label: "Segmentasi Lahan",
    hint: "Polygon lahan, kebun, permukiman",
    layerType: "land_segmentation",
    objectType: "land_segment",
    geometryType: "polygon",
    drawShape: "polygon",
    icon: Hexagon,
  },
  {
    key: "land_rectangle",
    label: "Blok Lahan",
    hint: "Rectangle untuk blok batas lahan cepat",
    layerType: "land_segmentation",
    objectType: "land_segment",
    geometryType: "rectangle",
    drawShape: "rectangle",
    icon: Square,
  },
  {
    key: "disaster_polygon",
    label: "Zona Rawan Bencana",
    hint: "Area bahaya banjir, longsor, kebakaran",
    layerType: "disaster_risk",
    objectType: "disaster_area",
    geometryType: "polygon",
    drawShape: "polygon",
    icon: CircleIcon,
  },
  {
    key: "disaster_circle",
    label: "Radius Risiko",
    hint: "Circle untuk radius bahaya dari satu titik",
    layerType: "disaster_risk",
    objectType: "radius_area",
    geometryType: "circle",
    drawShape: "circle",
    icon: CircleIcon,
  },
  {
    key: "mitigation_marker",
    label: "Titik Mitigasi",
    hint: "Posko, titik kumpul, fasilitas kesehatan",
    layerType: "mitigation_resource",
    objectType: "resource_point",
    geometryType: "point",
    drawShape: "marker",
    icon: MapPin,
  },
  {
    key: "evacuation_route",
    label: "Jalur Evakuasi",
    hint: "Polyline rute evakuasi dan distribusi",
    layerType: "evacuation_route",
    objectType: "route",
    geometryType: "linestring",
    drawShape: "polyline",
    icon: Route,
  },
  {
    key: "marker_label",
    label: "Marker & Label",
    hint: "Titik fasilitas atau catatan lapangan",
    layerType: "marker_label",
    objectType: "marker",
    geometryType: "point",
    drawShape: "marker",
    icon: MapPin,
  },
];

function layerColor(layerType?: LayerType, risk?: WorkspaceRiskLevel | null) {
  if (risk?.color) return risk.color;
  if (layerType === "disaster_risk") return "#d71920";
  if (layerType === "land_segmentation") return "#3b6d11";
  if (layerType === "evacuation_route") return "#005d9c";
  if (layerType === "mitigation_resource") return "#ba7517";
  return "#1c1a14";
}

function getFeatureGeometryType(feature: Feature): GeometryType {
  if (feature.geometry.type === "Point") return "point";
  if (feature.geometry.type === "LineString") return "linestring";
  return "polygon";
}

function getPointCoordinates(feature: Feature) {
  if (feature.geometry.type !== "Point") return { latitude: null, longitude: null };
  const [longitude, latitude] = feature.geometry.coordinates;
  return { latitude, longitude };
}

function getMetadataRadius(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("radius_m" in metadata)) return null;
  const radius = Number((metadata as { radius_m?: unknown }).radius_m);
  return Number.isFinite(radius) && radius > 0 ? radius : null;
}

function DrawBridge({ activeTool, onCreated }: { activeTool: ToolConfig | null; onCreated: (draft: DraftObject) => void }) {
  const map = useMap();
  const handlerRef = useRef<{ disable: () => void } | null>(null);

  useEffect(() => {
    handlerRef.current?.disable();
    handlerRef.current = null;

    if (!activeTool) return;

    const options = {
      shapeOptions: {
        color: layerColor(activeTool.layerType),
        weight: activeTool.layerType === "evacuation_route" ? 4 : 2,
        fillOpacity: activeTool.layerType === "disaster_risk" ? 0.16 : 0.22,
        dashArray: activeTool.layerType === "evacuation_route" ? "8 6" : undefined,
      },
    };

    const drawMap = map as L.DrawMap;
    const drawHandler =
      activeTool.drawShape === "polygon"
        ? new L.Draw.Polygon(drawMap, options)
        : activeTool.drawShape === "rectangle"
          ? new L.Draw.Rectangle(drawMap, options)
          : activeTool.drawShape === "circle"
            ? new L.Draw.Circle(drawMap, options)
        : activeTool.drawShape === "polyline"
          ? new L.Draw.Polyline(drawMap, options)
          : new L.Draw.Marker(drawMap);

    handlerRef.current = drawHandler;
    drawHandler.enable();

    const handleCreated: L.LeafletEventHandlerFn = (event) => {
      const createdEvent = event as L.DrawEvents.Created;
      const layer = createdEvent.layer;
      const geometry = layer.toGeoJSON() as Feature;
      const radiusSize = layer instanceof L.Circle ? Math.round(layer.getRadius() * 100) / 100 : null;
      const areaSize = radiusSize
        ? Math.round(Math.PI * radiusSize * radiusSize * 100) / 100
        : geometry.geometry.type === "Polygon"
          ? Math.round(turf.area(geometry) * 100) / 100
          : null;
      const lengthSize = radiusSize
        ? Math.round(2 * Math.PI * radiusSize * 100) / 100
        : geometry.geometry.type === "LineString"
          ? Math.round(turf.length(geometry, { units: "meters" }) * 100) / 100
          : null;
      const point = getPointCoordinates(geometry);

      onCreated({
        tool: {
          ...activeTool,
          geometryType: activeTool.geometryType === "circle" || activeTool.geometryType === "rectangle" ? activeTool.geometryType : getFeatureGeometryType(geometry),
        },
        geometry,
        areaSize,
        lengthSize,
        radiusSize,
        latitude: point.latitude,
        longitude: point.longitude,
      });
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      drawHandler.disable();
    };
  }, [activeTool, map, onCreated]);

  return null;
}

function objectSummary(object: WorkspaceMapObject) {
  const radius = getMetadataRadius(object.metadata);
  if (radius) return `Radius ${Math.round(radius)} m`;
  if (object.areaSize) return `${(object.areaSize / 10000).toFixed(2)} Ha`;
  if (object.lengthSize) return `${Math.round(object.lengthSize)} m`;
  if (object.latitude && object.longitude) return `${object.latitude.toFixed(5)}, ${object.longitude.toFixed(5)}`;
  return "Geometry JSON";
}

export function MapWorkspace({
  projectId,
  projectName,
  projectLocation = "Disaster Mitigation Unit",
  center = [-5.3971, 105.2668],
  zoom = 13,
  layers,
  riskLevels,
  initialObjects,
}: MapWorkspaceProps) {
  const [activeToolKey, setActiveToolKey] = useState<ToolKey>("land_polygon");
  const [activePrimaryLayer, setActivePrimaryLayer] = useState<LayerType>("land_segmentation");
  const [visibleOverlays, setVisibleOverlays] = useState<Record<LayerType, boolean>>({
    land_segmentation: true,
    disaster_risk: true,
    elevation: false,
    marker_label: true,
    evacuation_route: true,
    mitigation_resource: true,
  });
  const [objects, setObjects] = useState(initialObjects);
  const [draft, setDraft] = useState<DraftObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<WorkspaceMapObject | null>(initialObjects[0] ?? null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const activeTool = useMemo(() => tools.find((tool) => tool.key === activeToolKey) ?? null, [activeToolKey]);
  const layerById = useMemo(() => new Map(layers.map((layer) => [layer.id, layer])), [layers]);
  const layerByType = useMemo(() => new Map(layers.map((layer) => [layer.layerType, layer])), [layers]);
  const riskById = useMemo(() => new Map(riskLevels.map((risk) => [risk.id, risk])), [riskLevels]);

  const visibleObjects = objects.filter((object) => {
    const layer = layerById.get(object.layerId);
    if (!layer) return false;
    if (layer.renderType === "primary") return layer.layerType === activePrimaryLayer;
    return visibleOverlays[layer.layerType] ?? true;
  });

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const form = new FormData(event.currentTarget);
    const layer = layerByType.get(draft.tool.layerType);
    if (!layer) {
      setSaveError("Layer untuk tool ini belum tersedia. Buat ulang default layer project.");
      return;
    }

    const metadataText = String(form.get("metadata") ?? "{}");
    let metadata: unknown = {};
    try {
      metadata = metadataText.trim() ? JSON.parse(metadataText) : {};
    } catch {
      setSaveError("Metadata harus berupa JSON valid.");
      return;
    }

    const objectMetadata = draft.radiusSize
      ? { ...(metadata && typeof metadata === "object" ? metadata : {}), radius_m: draft.radiusSize }
      : metadata;

    setSaving(true);
    setSaveError("");

    const response = await fetch(`/api/projects/${projectId}/map-objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        label: String(form.get("label") ?? ""),
        layerId: layer.id,
        categoryId: Number(form.get("categoryId")) || null,
        riskLevelId: Number(form.get("riskLevelId")) || null,
        objectType: draft.tool.objectType,
        geometryType: draft.tool.geometryType,
        areaSize: draft.areaSize,
        lengthSize: draft.lengthSize,
        latitude: draft.latitude,
        longitude: draft.longitude,
        notes: String(form.get("notes") ?? ""),
        geometry: draft.geometry,
        metadata: objectMetadata,
      }),
    });

    const data = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setSaveError(data?.message ?? "Objek gagal disimpan.");
      return;
    }

    setObjects((current) => [data.object, ...current]);
    setSelectedObject(data.object);
    setDraft(null);
  }

  return (
    <div className="grid h-[calc(100vh-66px)] overflow-hidden border-t-2 border-earth-dark bg-earth-light md:grid-cols-[300px_1fr_340px]">
      <aside className="topographic-paper hidden min-h-0 overflow-y-auto border-r-2 border-earth-dark p-5 md:flex md:flex-col">
        <div>
          <h2 className="font-display text-3xl font-black">{projectName}</h2>
          <p className="label-mono mt-2 text-earth-dark/65">{projectLocation}</p>
        </div>

        <nav className="mt-7 space-y-3">
          {[
            { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
            { label: "Map Workspace", icon: MapIcon, href: `/projects/${projectId}/map` },
            { label: "Land Records", icon: Layers, href: `/land-records?project=${projectId}` },
            { label: "Risk Reports", icon: BarChart3, href: `/risk-reports?project=${projectId}` },
          ].map((item) => {
            const Icon = item.icon;
            const active = item.label === "Map Workspace";
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-3 border-2 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.06em] ${
                  active ? "border-earth-dark bg-moss-light shadow-[3px_3px_0_#1c1a14]" : "border-transparent text-earth-dark/75 hover:border-earth-dark"
                }`}
              >
                <Icon size={17} /> {item.label}
              </a>
            );
          })}
        </nav>

        <div className="mt-7 space-y-4 border-t-2 border-earth-dark pt-5">
          <a href="/projects/create" className="brutal-button w-full bg-earth-dark px-4 py-3 text-earth-light">
            <Plus size={17} /> Project Baru
          </a>

          <div className="brutal-card bg-earth-light p-4">
            <p className="label-mono mb-3">Primary Layer</p>
            {layers.filter((layer) => layer.renderType === "primary").map((layer) => (
              <label key={layer.id} className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="primaryLayer"
                  checked={activePrimaryLayer === layer.layerType}
                  onChange={() => setActivePrimaryLayer(layer.layerType)}
                  className="h-4 w-4 accent-earth-dark"
                />
                {layer.name}
              </label>
            ))}
          </div>

          <div className="brutal-card bg-earth-light p-4">
            <p className="label-mono mb-3">Overlay Layer</p>
            {layers.filter((layer) => layer.renderType === "overlay").map((layer) => (
              <label key={layer.id} className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={visibleOverlays[layer.layerType] ?? true}
                  onChange={(event) => setVisibleOverlays((current) => ({ ...current, [layer.layerType]: event.target.checked }))}
                  className="h-4 w-4 accent-earth-dark"
                />
                {layer.name}
              </label>
            ))}
          </div>

          <div className="brutal-card bg-earth-light p-4">
            <p className="label-mono mb-3">Drawing Tools</p>
            <div className="space-y-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const active = activeToolKey === tool.key;
                return (
                  <button
                    key={tool.key}
                    onClick={() => {
                      setActiveToolKey(tool.key);
                      setDraft(null);
                      const layer = layerByType.get(tool.layerType);
                      if (layer?.renderType === "primary") {
                        setActivePrimaryLayer(tool.layerType);
                      } else {
                        setVisibleOverlays((current) => ({ ...current, [tool.layerType]: true }));
                      }
                    }}
                    className={`flex w-full items-start gap-3 border-2 px-3 py-2 text-left ${active ? "border-earth-dark bg-moss-light shadow-[2px_2px_0_#1c1a14]" : "border-earth-dark/20 bg-earth-light"}`}
                    type="button"
                  >
                    <Icon size={18} className="mt-1 shrink-0" />
                    <span>
                      <span className="label-mono block">{tool.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-earth-dark/58">{tool.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t-2 border-earth-dark pt-5">
          <a href="/settings" className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.06em] text-earth-dark/70">
            <Settings size={18} /> Settings
          </a>
        </div>
      </aside>

      <section className="relative min-h-[520px] bg-[#dfddd5]">
        <div className="absolute left-4 top-4 z-[500] flex gap-3">
          <label className="glass-accent flex w-72 max-w-[calc(100vw-2rem)] items-center gap-2 border-2 border-earth-dark bg-earth-light/80 px-3 py-2 shadow-[3px_3px_0_#1c1a14]">
            <MapPin size={18} />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Search coordinates..." />
          </label>
          <div className="glass-accent hidden border-2 border-earth-dark bg-earth-light/80 px-3 py-2 text-xs shadow-[3px_3px_0_#1c1a14] md:block">
            Tool: <span className="font-bold">{activeTool?.label}</span>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 z-[500] border border-earth-dark/20 bg-earth-light px-3 py-2 text-xs shadow-sm">
          {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E | {objects.length} objek
        </div>
        <MapContainer center={center} zoom={zoom} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {visibleObjects.map((object) => {
            const layer = layerById.get(object.layerId);
            const risk = object.riskLevelId ? riskById.get(object.riskLevelId) : null;
            const color = layerColor(layer?.layerType, risk);
            const radius = getMetadataRadius(object.metadata);

            if (object.geometryType === "circle" && object.latitude && object.longitude && radius) {
              return (
                <LeafletCircle
                  key={`${object.id}-${object.updatedAt}`}
                  center={[object.latitude, object.longitude]}
                  radius={radius}
                  eventHandlers={{ click: () => setSelectedObject(object) }}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.16, weight: 2 }}
                />
              );
            }

            if (object.geometry.geometry.type === "Point" && object.latitude && object.longitude) {
              return (
                <Marker key={object.id} position={[object.latitude, object.longitude]} eventHandlers={{ click: () => setSelectedObject(object) }}>
                  <Popup>{object.name}</Popup>
                </Marker>
              );
            }

            return (
              <GeoJSONLayer
                key={`${object.id}-${object.updatedAt}`}
                data={object.geometry}
                eventHandlers={{ click: () => setSelectedObject(object) }}
                style={() => ({
                  color,
                  weight: layer?.layerType === "evacuation_route" ? 4 : 2,
                  fillColor: color,
                  fillOpacity: layer?.layerType === "disaster_risk" ? 0.14 : 0.22,
                  dashArray: layer?.layerType === "evacuation_route" ? "8 6" : undefined,
                })}
              />
            );
          })}
          {draft?.tool.geometryType === "circle" && draft.latitude && draft.longitude && draft.radiusSize ? (
            <LeafletCircle
              key="draft-circle"
              center={[draft.latitude, draft.longitude]}
              radius={draft.radiusSize}
              pathOptions={{ color: layerColor(draft.tool.layerType), fillColor: layerColor(draft.tool.layerType), fillOpacity: 0.18, weight: 2 }}
            />
          ) : draft?.geometry.geometry.type === "Point" && draft.latitude && draft.longitude ? (
            <Marker key="draft-marker" position={[draft.latitude, draft.longitude]}>
              <Popup>{draft.tool.label}</Popup>
            </Marker>
          ) : draft ? (
            <GeoJSONLayer
              key={`draft-${draft.tool.key}`}
              data={draft.geometry}
              style={() => ({
                color: layerColor(draft.tool.layerType),
                weight: draft.tool.layerType === "evacuation_route" ? 4 : 2,
                fillColor: layerColor(draft.tool.layerType),
                fillOpacity: draft.tool.layerType === "disaster_risk" ? 0.18 : 0.24,
                dashArray: draft.tool.layerType === "evacuation_route" ? "8 6" : undefined,
              })}
            />
          ) : null}
          <DrawBridge
            activeTool={activeTool}
            onCreated={(createdDraft) => {
              setDraft(createdDraft);
              setSelectedObject(null);
            }}
          />
        </MapContainer>
      </section>

      <aside className="topographic-paper hidden min-h-0 overflow-hidden border-l-2 border-earth-dark md:flex md:flex-col">
        <div className="flex items-center justify-between border-b-2 border-earth-dark px-5 py-4">
          <h2 className="font-display text-2xl font-black">{draft ? "Simpan Objek" : "Object Details"}</h2>
          <button aria-label="Tutup panel" onClick={() => setDraft(null)}><X /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {draft ? (
            <form onSubmit={saveDraft} className="space-y-4">
              <div className="brutal-card bg-earth-light p-4">
                <p className="label-mono text-moss">{draft.tool.label}</p>
                <label className="mt-4 block">
                  <span className="label-mono">Nama Objek</span>
                  <input name="name" required className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="Contoh: Sector 7G" />
                </label>
                <label className="mt-4 block">
                  <span className="label-mono">Label Peta</span>
                  <input name="label" className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="Opsional" />
                </label>
                <label className="mt-4 block">
                  <span className="label-mono">Kategori</span>
                  <select name="categoryId" className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none">
                    <option value="">Tidak dipilih</option>
                    {(layerByType.get(draft.tool.layerType)?.categories ?? []).map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                {draft.tool.layerType === "disaster_risk" ? (
                  <label className="mt-4 block">
                    <span className="label-mono">Tingkat Risiko</span>
                    <select name="riskLevelId" className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none">
                      <option value="">Pilih risiko</option>
                      {riskLevels.map((risk) => (
                        <option key={risk.id} value={risk.id}>{risk.name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="brutal-card bg-earth-light p-4">
                <p className="label-mono">Hasil Pengukuran</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-earth-dark/55">Luas</p>
                    <p className="font-bold">{draft.areaSize ? `${(draft.areaSize / 10000).toFixed(2)} Ha` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-earth-dark/55">Radius</p>
                    <p className="font-bold">{draft.radiusSize ? `${Math.round(draft.radiusSize)} m` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-earth-dark/55">Panjang</p>
                    <p className="font-bold">{draft.lengthSize ? `${Math.round(draft.lengthSize)} m` : "-"}</p>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="label-mono">Survey Notes</span>
                <textarea name="notes" className="mt-2 min-h-24 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="Catatan lapangan" />
              </label>
              <label className="block">
                <span className="label-mono">Metadata JSON</span>
                <textarea name="metadata" defaultValue="{}" className="mt-2 min-h-28 w-full border-2 border-earth-dark bg-earth-dark px-3 py-2 text-xs text-earth-light outline-none" />
              </label>
              {saveError ? <p className="border-2 border-hazard bg-hazard-light p-3 text-sm text-hazard">{saveError}</p> : null}
              <button className="brutal-button w-full bg-earth-dark px-4 py-3 text-earth-light" disabled={saving}>
                <Save size={17} /> {saving ? "Menyimpan..." : "Simpan Objek"}
              </button>
            </form>
          ) : selectedObject ? (
            <div className="space-y-6">
              <div className="brutal-card bg-earth-light p-4">
                <div className="flex justify-between gap-3">
                  <span className="bg-hazard-light px-2 py-1 text-xs font-bold uppercase text-hazard">
                    {selectedObject.riskLevelId ? riskById.get(selectedObject.riskLevelId)?.name : selectedObject.objectType}
                  </span>
                  <MousePointer2 className="text-earth-dark/60" />
                </div>
                <h3 className="mt-3 text-lg font-bold">{selectedObject.name}</h3>
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="label-mono text-earth-dark/60">Layer</p>
                    <p className="font-bold">{layerById.get(selectedObject.layerId)?.name}</p>
                  </div>
                  <div>
                    <p className="label-mono text-earth-dark/60">Ukuran</p>
                    <p className="font-bold">{objectSummary(selectedObject)}</p>
                  </div>
                </div>
                <p className="label-mono mt-5 text-earth-dark/60">Geometry</p>
                <p className="mt-2 text-sm text-earth-dark/70">{selectedObject.geometryType}</p>
              </div>
              <div>
                <p className="label-mono mb-3">Survey Notes</p>
                <div className="brutal-card min-h-24 bg-earth-light p-4 text-sm leading-6">
                  {selectedObject.notes || "Belum ada catatan."}
                </div>
              </div>
              <div>
                <p className="label-mono mb-3">Raw GeoJSON</p>
                <pre className="max-h-52 overflow-auto bg-earth-dark p-4 text-xs leading-6 text-earth-light">
                  {JSON.stringify(selectedObject.geometry, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="brutal-card bg-earth-light p-5">
              <p className="label-mono text-moss">Mulai Drawing</p>
              <p className="mt-3 text-sm leading-6 text-earth-dark/70">
                Pilih tool di sidebar kiri, gambar di peta, lalu isi detail objek untuk menyimpan data geospasial ke database.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
