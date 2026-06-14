"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle as LeafletCircle, GeoJSON as GeoJSONLayer, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import * as turf from "@turf/turf";
import { BarChart3, Circle as CircleIcon, FolderOpen, Hexagon, Layers, MapIcon, MapPin, MousePointer2, Plus, Route, Save, Search, Settings, Square, Trash2, X } from "lucide-react";
import type { Feature, LineString } from "geojson";

type LayerType = "land_segmentation" | "disaster_risk" | "elevation" | "marker_label" | "evacuation_route" | "mitigation_resource";
type GeometryType = "point" | "linestring" | "polygon" | "rectangle" | "circle";
type ObjectType = "land_segment" | "disaster_area" | "elevation_area" | "marker" | "route" | "resource_point" | "radius_area";
type ToolKey = "land_polygon" | "land_rectangle" | "disaster_polygon" | "disaster_circle" | "mitigation_marker" | "marker_label";
type ToolTabKey = "disaster" | "segmentation";

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
  exporterName?: string;
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

type WorkspaceCommandEvent = CustomEvent<{ type: "pdf" | "save" }>;
type EvacuationRouteState = {
  loading: boolean;
  error: string;
  target: WorkspaceMapObject | null;
  distanceM: number | null;
  durationS: number | null;
  geometry: Feature | null;
};
type ReportLegendEntry = {
  label: string;
  color: string;
  count: number;
};
type ReportListEntry = {
  label: string;
  value: string;
  color?: string;
};
type PdfReportOptions = {
  projectName: string;
  projectLocation: string;
  exporterName: string;
  infoLines: string[];
  legendEntries: ReportLegendEntry[];
  riskEntries: ReportListEntry[];
  mitigationEntries: ReportListEntry[];
  exportedAt: Date;
  scaleMeters: number | null;
  mapCenter: L.LatLng;
  mapBounds: L.LatLngBounds;
};
type RouteCandidate = {
  object: WorkspaceMapObject;
  point: [number, number];
  directDistanceM: number;
};
type NearbyCandidate = WorkspaceMapObject & {
  distanceM: number;
  layerType?: LayerType;
};
type BoundaryResult = {
  id: string;
  name: string;
  osmClass: string | null;
  osmType: string | null;
  geojson: Feature;
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
    label: "Circle Rawan Bencana",
    hint: "Circle untuk area bahaya dari satu titik",
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

const toolTabs: Array<{ key: ToolTabKey; label: string; toolKeys: ToolKey[] }> = [
  { key: "disaster", label: "Rawan Bencana", toolKeys: ["disaster_polygon", "disaster_circle", "mitigation_marker"] },
  { key: "segmentation", label: "Segmentasi", toolKeys: ["land_polygon", "land_rectangle", "marker_label"] },
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

function geomanShape(drawShape: ToolConfig["drawShape"]) {
  if (drawShape === "polygon") return "Polygon";
  if (drawShape === "rectangle") return "Rectangle";
  if (drawShape === "circle") return "Circle";
  if (drawShape === "polyline") return "Line";
  return "Marker";
}

function DrawBridge({ activeTool, onCreated }: { activeTool: ToolConfig | null; onCreated: (draft: DraftObject) => void }) {
  const map = useMap();

  useEffect(() => {
    map.pm.setGlobalOptions({
      snappable: true,
      snapDistance: 22,
      snapMiddle: true,
      snapSegment: true,
      snapVertex: true,
      allowSelfIntersection: false,
    });

    return () => {
      map.pm.disableDraw();
    };
  }, [map]);

  useEffect(() => {
    map.pm.disableDraw();

    if (!activeTool) return;

    map.pm.enableDraw(geomanShape(activeTool.drawShape), {
      continueDrawing: false,
      snappable: true,
      snapDistance: 22,
      snapMiddle: true,
      snapSegment: true,
      snapVertex: true,
      allowSelfIntersection: false,
      finishOn: activeTool.drawShape === "marker" ? "click" : undefined,
      autoTracing: activeTool.drawShape === "polygon",
      pathOptions: {
        color: layerColor(activeTool.layerType),
        weight: activeTool.layerType === "evacuation_route" ? 4 : 2,
        fillOpacity: activeTool.layerType === "disaster_risk" ? 0.16 : 0.22,
        dashArray: activeTool.layerType === "evacuation_route" ? "8 6" : undefined,
      },
    });

    const handleCreated = (event: L.PM.CreateEventHandler extends (payload: infer Payload) => void ? Payload : never) => {
      const layer = event.layer as L.Layer & { toGeoJSON: () => Feature };
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

      map.removeLayer(layer);
      map.pm.disableDraw();
    };

    map.on("pm:create", handleCreated);

    return () => {
      map.off("pm:create", handleCreated);
      map.pm.disableDraw();
    };
  }, [activeTool, map, onCreated]);

  return null;
}

function MapReady({ onReady }: { onReady: (map: L.Map | null) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
    return () => onReady(null);
  }, [map, onReady]);

  return null;
}

function objectSummary(object: WorkspaceMapObject) {
  const radius = getMetadataRadius(object.metadata);
  if (radius) return `Circle ${Math.round(radius)} m`;
  if (object.areaSize) return `${(object.areaSize / 10000).toFixed(2)} Ha`;
  if (object.lengthSize) return `${Math.round(object.lengthSize)} m`;
  if (object.latitude && object.longitude) return `${object.latitude.toFixed(5)}, ${object.longitude.toFixed(5)}`;
  return "Geometry JSON";
}

function countCoordinatePairs(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") return 1;
  return value.reduce((sum, item) => sum + countCoordinatePairs(item), 0);
}

function objectCoordinateCount(object: WorkspaceMapObject) {
  const geometry = object.geometry.geometry;
  if ("coordinates" in geometry) return countCoordinatePairs(geometry.coordinates);
  return 0;
}

function objectTooltipText(object: WorkspaceMapObject, layer?: WorkspaceLayer, risk?: WorkspaceRiskLevel | null) {
  return {
    title: object.label || object.name,
    type: risk?.name || layer?.name || object.objectType,
    summary: object.description || object.notes || objectSummary(object),
  };
}

function objectPoint(object: WorkspaceMapObject): [number, number] | null {
  if (object.latitude !== null && object.longitude !== null) return [object.longitude, object.latitude];
  if (object.geometry.geometry.type === "Point") return object.geometry.geometry.coordinates as [number, number];
  if (object.geometry.geometry.type === "Polygon" || object.geometry.geometry.type === "LineString") {
    const center = turf.centroid(object.geometry);
    return center.geometry.coordinates as [number, number];
  }
  return null;
}

const MAX_ROUTE_ORIGIN_CANDIDATES = 16;

function pushUniqueCoordinate(coordinates: Array<[number, number]>, coordinate: [number, number]) {
  const exists = coordinates.some(([longitude, latitude]) => (
    Math.abs(longitude - coordinate[0]) < 0.0000001
    && Math.abs(latitude - coordinate[1]) < 0.0000001
  ));
  if (!exists) coordinates.push(coordinate);
}

function sampleLineForRouting(line: Feature<LineString>, maxCandidates: number) {
  if (line.geometry.type !== "LineString") return [] as Array<[number, number]>;
  const lengthKm = turf.length(line, { units: "kilometers" });
  const coordinates: Array<[number, number]> = [];

  if (!Number.isFinite(lengthKm) || lengthKm <= 0) {
    const first = line.geometry.coordinates[0];
    return first ? [[Number(first[0]), Number(first[1])]] : coordinates;
  }

  const sampleCount = Math.max(2, maxCandidates);
  for (let index = 0; index < sampleCount; index += 1) {
    const distanceKm = sampleCount === 1 ? 0 : (lengthKm * index) / (sampleCount - 1);
    const point = turf.along(line, distanceKm, { units: "kilometers" });
    const [longitude, latitude] = point.geometry.coordinates;
    pushUniqueCoordinate(coordinates, [longitude, latitude]);
  }

  return coordinates;
}

function evacuationOriginCandidates(object: WorkspaceMapObject) {
  const geometry = object.geometry.geometry;
  const fallback = objectPoint(object);

  if (geometry.type === "Point") {
    const center = geometry.coordinates as [number, number];
    const radiusM = getMetadataRadius(object.metadata);
    if (!radiusM || object.geometryType !== "circle") return [center];

    const circleCandidates: Array<[number, number]> = [];
    for (let bearing = 0; bearing < 360; bearing += 30) {
      const point = turf.destination(turf.point(center), radiusM / 1000, bearing, { units: "kilometers" });
      const [longitude, latitude] = point.geometry.coordinates;
      pushUniqueCoordinate(circleCandidates, [longitude, latitude]);
    }
    return circleCandidates.slice(0, MAX_ROUTE_ORIGIN_CANDIDATES);
  }

  if (geometry.type === "Polygon") {
    const outerRing = geometry.coordinates[0];
    if (outerRing?.length >= 2) {
      return sampleLineForRouting(
        turf.lineString(outerRing),
        MAX_ROUTE_ORIGIN_CANDIDATES,
      );
    }
  }

  if (geometry.type === "LineString") {
    return sampleLineForRouting(object.geometry as Feature<LineString>, MAX_ROUTE_ORIGIN_CANDIDATES);
  }

  return fallback ? [fallback] : [];
}

function isDisasterObject(object: WorkspaceMapObject, layer?: WorkspaceLayer) {
  return layer?.layerType === "disaster_risk" || object.objectType === "disaster_area" || object.objectType === "radius_area";
}

function formatDistance(meters: number | null) {
  if (meters === null) return "-";
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "-";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

function haversineDistanceMeters(origin: [number, number], destination: [number, number]) {
  const [lon1, lat1] = origin;
  const [lon2, lat2] = destination;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusM = 6371000;
  const latDelta = toRadians(lat2 - lat1);
  const lonDelta = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lonDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
}

function durationFromDistanceAndSpeed(distanceM: number | null, speedKmh: number) {
  if (distanceM === null || !Number.isFinite(speedKmh) || speedKmh <= 0) return null;
  return (distanceM / 1000 / speedKmh) * 3600;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function vehicleEstimates(distanceM: number | null, speedKmh: number) {
  const MOTOR_SPEED_MULTIPLIER = 1.2;
  const BICYCLE_SPEED_MULTIPLIER = 0.35;
  const BICYCLE_SPEED_MIN_KMH = 10;
  const BICYCLE_SPEED_MAX_KMH = 25;
  const WALKING_SPEED_KMH = 5;

  const motorSpeedKmh = speedKmh * MOTOR_SPEED_MULTIPLIER;
  const bicycleSpeedKmh = clamp(speedKmh * BICYCLE_SPEED_MULTIPLIER, BICYCLE_SPEED_MIN_KMH, BICYCLE_SPEED_MAX_KMH);
  const carDurationS = durationFromDistanceAndSpeed(distanceM, speedKmh);
  const motorDurationS = durationFromDistanceAndSpeed(distanceM, motorSpeedKmh);
  const bicycleDurationS = durationFromDistanceAndSpeed(distanceM, bicycleSpeedKmh);
  const walkingDurationS = durationFromDistanceAndSpeed(distanceM, WALKING_SPEED_KMH);

  return [
    { label: "Mobil", value: formatDuration(carDurationS) },
    { label: "Motor", value: formatDuration(motorDurationS) },
    { label: "Sepeda", value: formatDuration(bicycleDurationS) },
    { label: "Jalan Kaki", value: formatDuration(walkingDurationS) },
  ];
}

function dispatchWorkspaceAction(type: "pdf" | "save", status: "pending" | "success" | "error", message: string) {
  window.dispatchEvent(new CustomEvent("sigmanta:workspace-action", { detail: { type, status, message } }));
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "project";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function createPdfBlobFromCanvas(canvas: HTMLCanvasElement) {
  const encoder = new TextEncoder();
  const imageBytes = dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92));
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 22;
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;
  const imageAspect = canvas.width / canvas.height;
  let imageWidth = availableWidth;
  let imageHeight = imageWidth / imageAspect;
  if (imageHeight > availableHeight) {
    imageHeight = availableHeight;
    imageWidth = imageHeight * imageAspect;
  }
  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = pageHeight - margin - imageHeight;

  const objects: Uint8Array[] = [];
  objects.push(encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"));
  objects.push(encoder.encode("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"));
  objects.push(encoder.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`));
  objects.push(concatBytes([
    encoder.encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`),
    imageBytes,
    encoder.encode("\nendstream\nendobj\n"),
  ]));

  const content = `q\n${imageWidth.toFixed(2)} 0 0 ${imageHeight.toFixed(2)} ${imageX.toFixed(2)} ${imageY.toFixed(2)} cm\n/Im0 Do\nQ\n`;
  objects.push(encoder.encode(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`));

  const chunks: Uint8Array[] = [encoder.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = [0];
  let byteOffset = chunks[0].length;
  objects.forEach((object) => {
    offsets.push(byteOffset);
    chunks.push(object);
    byteOffset += object.length;
  });

  const xrefOffset = byteOffset;
  const xrefRows = offsets.map((offset, index) => (index === 0 ? "0000000000 65535 f \n" : `${String(offset).padStart(10, "0")} 00000 n \n`)).join("");
  chunks.push(encoder.encode(`xref\n0 ${offsets.length}\n${xrefRows}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));

  const blobParts = chunks.map((chunk) => chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer);
  return new Blob(blobParts, { type: "application/pdf" });
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    const isLastVisibleLine = index === maxLines - 1 && lines.length > maxLines;
    const value = isLastVisibleLine ? `${item.slice(0, Math.max(0, item.length - 3))}...` : item;
    ctx.fillText(value, x, y + index * lineHeight);
  });

  return Math.min(lines.length, maxLines) * lineHeight;
}

function drawReportSectionTitle(ctx: CanvasRenderingContext2D, title: string, x: number, y: number) {
  ctx.fillStyle = "#1c1a14";
  ctx.font = "700 22px monospace";
  ctx.fillText(title.toUpperCase(), x, y);
  ctx.strokeStyle = "#1c1a14";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + 340, y + 10);
  ctx.stroke();
}

function drawReportEntries(ctx: CanvasRenderingContext2D, entries: ReportListEntry[], x: number, y: number, maxWidth: number, maxItems: number) {
  ctx.font = "700 17px monospace";
  let cursorY = y;
  entries.slice(0, maxItems).forEach((entry) => {
    if (entry.color) {
      ctx.fillStyle = entry.color;
      ctx.fillRect(x, cursorY - 14, 18, 18);
      ctx.strokeStyle = "#1c1a14";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, cursorY - 14, 18, 18);
    }
    ctx.fillStyle = "#1c1a14";
    const labelX = entry.color ? x + 28 : x;
    const usedHeight = drawWrappedText(ctx, `${entry.label}: ${entry.value}`, labelX, cursorY, maxWidth - (entry.color ? 28 : 0), 21, 2);
    cursorY += Math.max(24, usedHeight + 8);
  });

  if (entries.length > maxItems) {
    ctx.fillStyle = "rgba(28,26,20,0.62)";
    ctx.fillText(`+${entries.length - maxItems} item lain`, x, cursorY);
    cursorY += 24;
  }

  if (!entries.length) {
    ctx.fillStyle = "rgba(28,26,20,0.62)";
    ctx.fillText("Tidak ada data terlihat", x, cursorY);
    cursorY += 24;
  }

  return cursorY;
}

function niceScaleDistance(maxMeters: number) {
  const distances = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000];
  return distances.filter((distance) => distance <= maxMeters).pop() ?? distances[0];
}

function formatScaleDistance(meters: number) {
  if (meters < 1000) return `${meters} m`;
  const kilometers = meters / 1000;
  return `${Number.isInteger(kilometers) ? kilometers.toFixed(0) : kilometers.toFixed(1)} km`;
}

function drawScaleBar(ctx: CanvasRenderingContext2D, x: number, y: number, mapWidth: number, visibleMeters: number | null) {
  if (!visibleMeters || visibleMeters <= 0) return;
  const scaleMeters = niceScaleDistance(visibleMeters * 0.26);
  const width = Math.max(90, Math.min(280, (scaleMeters / visibleMeters) * mapWidth));
  const segmentWidth = width / 4;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1c1a14";
  ctx.fillStyle = "#1c1a14";
  ctx.font = "700 18px monospace";
  ctx.fillText("0", x - 4, y - 12);
  ctx.fillText(formatScaleDistance(scaleMeters / 2), x + width / 2 - 28, y - 12);
  ctx.fillText(formatScaleDistance(scaleMeters), x + width - 34, y - 12);

  for (let index = 0; index < 4; index += 1) {
    ctx.fillStyle = index % 2 === 0 ? "#1c1a14" : "#f5f0e8";
    ctx.fillRect(x + index * segmentWidth, y, segmentWidth, 24);
    ctx.strokeRect(x + index * segmentWidth, y, segmentWidth, 24);
  }
  ctx.restore();
}

function drawNorthArrow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "#1c1a14";
  ctx.strokeStyle = "#1c1a14";
  ctx.lineWidth = 2;
  ctx.font = "700 24px monospace";
  ctx.fillText("N", x - 8, y - 54);
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x - 26, y + 36);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x + 26, y + 36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f5f0e8";
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y + 11);
  ctx.lineTo(x + 15, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function createCartographicReportCanvas(mapCanvas: HTMLCanvasElement, options: PdfReportOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = 1684;
  canvas.height = 1190;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas laporan PDF tidak tersedia.");

  const page = { x: 48, y: 48, width: 1588, height: 1094 };
  const mapFrame = { x: 62, y: 72, width: 1092, height: 880 };
  const sidebar = { x: 1186, y: 72, width: 414, height: 880 };
  const footer = { x: 62, y: 984, width: 1538, height: 112 };

  ctx.fillStyle = "#f7f5ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#1c1a14";
  ctx.lineWidth = 3;
  ctx.strokeRect(page.x, page.y, page.width, page.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(mapFrame.x, mapFrame.y, mapFrame.width, mapFrame.height);
  ctx.strokeRect(mapFrame.x, mapFrame.y, mapFrame.width, mapFrame.height);

  const imageAspect = mapCanvas.width / mapCanvas.height;
  const frameAspect = mapFrame.width / mapFrame.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = mapCanvas.width;
  let sourceHeight = mapCanvas.height;
  if (imageAspect > frameAspect) {
    sourceWidth = mapCanvas.height * frameAspect;
    sourceX = (mapCanvas.width - sourceWidth) / 2;
  } else {
    sourceHeight = mapCanvas.width / frameAspect;
    sourceY = (mapCanvas.height - sourceHeight) / 2;
  }
  ctx.drawImage(mapCanvas, sourceX, sourceY, sourceWidth, sourceHeight, mapFrame.x, mapFrame.y, mapFrame.width, mapFrame.height);

  ctx.strokeStyle = "rgba(28,26,20,0.42)";
  ctx.lineWidth = 1;
  ctx.font = "700 16px monospace";
  ctx.fillStyle = "#1c1a14";
  for (let index = 1; index < 4; index += 1) {
    const x = mapFrame.x + (mapFrame.width / 4) * index;
    const longitude = options.mapBounds.getWest() + ((options.mapBounds.getEast() - options.mapBounds.getWest()) / 4) * index;
    ctx.beginPath();
    ctx.moveTo(x, mapFrame.y);
    ctx.lineTo(x, mapFrame.y + mapFrame.height);
    ctx.stroke();
    ctx.fillText(`${longitude.toFixed(3)}`, x - 28, mapFrame.y - 14);
  }
  for (let index = 1; index < 4; index += 1) {
    const y = mapFrame.y + (mapFrame.height / 4) * index;
    const latitude = options.mapBounds.getNorth() - ((options.mapBounds.getNorth() - options.mapBounds.getSouth()) / 4) * index;
    ctx.beginPath();
    ctx.moveTo(mapFrame.x, y);
    ctx.lineTo(mapFrame.x + mapFrame.width, y);
    ctx.stroke();
    ctx.fillText(`${latitude.toFixed(3)}`, mapFrame.x - 56, y + 6);
  }

  drawNorthArrow(ctx, mapFrame.x + 120, mapFrame.y + 122);
  drawScaleBar(ctx, mapFrame.x + 690, mapFrame.y + mapFrame.height - 58, mapFrame.width, options.scaleMeters);

  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(sidebar.x, sidebar.y, sidebar.width, sidebar.height);
  ctx.strokeStyle = "#1c1a14";
  ctx.lineWidth = 3;
  ctx.strokeRect(sidebar.x, sidebar.y, sidebar.width, sidebar.height);

  ctx.fillStyle = "#1c1a14";
  ctx.font = "900 42px Georgia, serif";
  drawWrappedText(ctx, options.projectName, sidebar.x + 26, sidebar.y + 58, sidebar.width - 52, 44, 3);
  ctx.font = "700 18px monospace";
  ctx.fillStyle = "rgba(28,26,20,0.68)";
  drawWrappedText(ctx, options.projectLocation || "Lokasi belum diatur", sidebar.x + 26, sidebar.y + 178, sidebar.width - 52, 24, 2);

  let cursorY = sidebar.y + 234;
  drawReportSectionTitle(ctx, "Ringkasan", sidebar.x + 26, cursorY);
  cursorY += 38;
  ctx.font = "700 18px monospace";
  ctx.fillStyle = "#1c1a14";
  options.infoLines.slice(2, 7).forEach((line) => {
    cursorY += drawWrappedText(ctx, line, sidebar.x + 26, cursorY, sidebar.width - 52, 23, 1) + 4;
  });

  cursorY += 16;
  drawReportSectionTitle(ctx, "Risiko", sidebar.x + 26, cursorY);
  cursorY = drawReportEntries(ctx, options.riskEntries, sidebar.x + 28, cursorY + 38, sidebar.width - 58, 4) + 12;

  drawReportSectionTitle(ctx, "Mitigasi / Marker", sidebar.x + 26, cursorY);
  cursorY = drawReportEntries(ctx, options.mitigationEntries, sidebar.x + 28, cursorY + 38, sidebar.width - 58, 4) + 12;

  drawReportSectionTitle(ctx, "Legenda", sidebar.x + 26, cursorY);
  drawReportEntries(
    ctx,
    options.legendEntries.map((entry) => ({ label: entry.label, value: `${entry.count} objek`, color: entry.color })),
    sidebar.x + 28,
    cursorY + 38,
    sidebar.width - 58,
    5
  );

  ctx.fillStyle = "#1c1a14";
  ctx.fillRect(footer.x, footer.y, footer.width, footer.height);
  ctx.fillStyle = "#f5f0e8";
  ctx.font = "900 30px Georgia, serif";
  ctx.fillText("SIGMANTA GIS", footer.x + 28, footer.y + 42);
  ctx.font = "700 17px monospace";
  ctx.fillText(`Export: ${options.exportedAt.toLocaleString("id-ID")}`, footer.x + 28, footer.y + 78);
  ctx.fillText(`Exporter: ${options.exporterName}`, footer.x + 420, footer.y + 42);
  ctx.fillText(`Center: ${options.mapCenter.lat.toFixed(5)}, ${options.mapCenter.lng.toFixed(5)}`, footer.x + 420, footer.y + 78);
  ctx.fillText("Sumber: data project dan objek aktif pada workspace", footer.x + 900, footer.y + 78);

  return canvas;
}

function drawGeoJsonObject(ctx: CanvasRenderingContext2D, map: L.Map, object: WorkspaceMapObject, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = object.objectType === "route" ? 4 : 2;
  ctx.globalAlpha = 1;

  const drawPath = (coordinates: number[][], closePath = false) => {
    coordinates.forEach(([longitude, latitude], index) => {
      const point = map.latLngToContainerPoint([latitude, longitude]);
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    if (closePath) ctx.closePath();
  };

  if (object.geometryType === "circle" && object.latitude && object.longitude) {
    const radius = getMetadataRadius(object.metadata);
    if (radius) {
      const center = map.latLngToContainerPoint([object.latitude, object.longitude]);
      const metersPerDegreeLng = Math.max(111320 * Math.cos((object.latitude * Math.PI) / 180), 1);
      const edge = map.latLngToContainerPoint([object.latitude, object.longitude + radius / metersPerDegreeLng]);
      const pixelRadius = Math.abs(edge.x - center.x);
      ctx.beginPath();
      ctx.arc(center.x, center.y, pixelRadius, 0, Math.PI * 2);
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (object.geometry.geometry.type === "Point") {
    const [longitude, latitude] = object.geometry.geometry.coordinates;
    const point = map.latLngToContainerPoint([latitude, longitude]);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f4eee6";
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (object.geometry.geometry.type === "LineString") {
    ctx.beginPath();
    drawPath(object.geometry.geometry.coordinates as number[][]);
    ctx.setLineDash(object.objectType === "route" ? [8, 6] : []);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (object.geometry.geometry.type === "Polygon") {
    ctx.beginPath();
    const rings = object.geometry.geometry.coordinates as number[][][];
    rings.forEach((ring) => drawPath(ring, true));
    ctx.globalAlpha = object.objectType === "disaster_area" || object.objectType === "radius_area" ? 0.16 : 0.22;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.restore();
}

function drawExportInfoPanel(ctx: CanvasRenderingContext2D, canvasWidth: number, lines: string[]) {
  const scale = canvasWidth > 1100 ? 1 : Math.max(0.78, canvasWidth / 1100);
  const panelX = 18;
  const panelY = 18;
  const panelWidth = Math.min(430 * scale, canvasWidth - 36);
  const lineHeight = 18 * scale;
  const padding = 14 * scale;
  const panelHeight = padding * 2 + lines.length * lineHeight;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#1c1a14";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
  ctx.fillStyle = "#1c1a14";
  ctx.font = `700 ${13 * scale}px monospace`;
  lines.forEach((line, index) => {
    const text = line.length > 58 ? `${line.slice(0, 55)}...` : line;
    ctx.fillText(text, panelX + padding, panelY + padding + lineHeight * (index + 0.75));
  });
  ctx.restore();
}

async function renderLeafletViewportCanvas(map: L.Map, objects: WorkspaceMapObject[], getColor: (object: WorkspaceMapObject) => string, infoLines?: string[]) {
  const size = map.getSize();
  const container = map.getContainer();
  const containerRect = container.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size.x * scale);
  canvas.height = Math.round(size.y * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser.");

  ctx.scale(scale, scale);
  ctx.fillStyle = "#dfddd5";
  ctx.fillRect(0, 0, size.x, size.y);

  const tiles = Array.from(container.querySelectorAll<HTMLImageElement>(".leaflet-tile-loaded"));
  await Promise.all(tiles.map((tile) => tile.decode?.().catch(() => undefined) ?? Promise.resolve()));

  tiles.forEach((tile) => {
    if (!tile.naturalWidth || !tile.naturalHeight) return;
    const rect = tile.getBoundingClientRect();
    const opacity = Number(tile.style.opacity || 1);
    ctx.globalAlpha = Number.isFinite(opacity) ? opacity : 1;
    ctx.drawImage(tile, rect.left - containerRect.left, rect.top - containerRect.top, rect.width, rect.height);
  });
  ctx.globalAlpha = 1;

  objects.forEach((object) => drawGeoJsonObject(ctx, map, object, getColor(object)));
  if (infoLines?.length) drawExportInfoPanel(ctx, size.x, infoLines);

  return canvas;
}

function getVisibleHorizontalMeters(map: L.Map) {
  const size = map.getSize();
  if (!size.x || !size.y) return null;
  const y = size.y / 2;
  const left = map.containerPointToLatLng([0, y]);
  const right = map.containerPointToLatLng([size.x, y]);
  return map.distance(left, right);
}

async function exportLeafletReportPdf(map: L.Map, objects: WorkspaceMapObject[], getColor: (object: WorkspaceMapObject) => string, options: Omit<PdfReportOptions, "exportedAt" | "scaleMeters" | "mapCenter" | "mapBounds">) {
  const mapCanvas = await renderLeafletViewportCanvas(map, objects, getColor);
  const reportCanvas = createCartographicReportCanvas(mapCanvas, {
    ...options,
    exportedAt: new Date(),
    scaleMeters: getVisibleHorizontalMeters(map),
    mapCenter: map.getCenter(),
    mapBounds: map.getBounds(),
  });
  const blob = createPdfBlobFromCanvas(reportCanvas);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  downloadBlob(blob, `sigmanta-${safeFilename(options.projectName)}-${timestamp}.pdf`);
}

export function MapWorkspace({
  projectId,
  projectName,
  projectLocation = "Disaster Mitigation Unit",
  exporterName = "SIGMANTA User",
  center = [-5.3971, 105.2668],
  zoom = 13,
  layers,
  riskLevels,
  initialObjects,
}: MapWorkspaceProps) {
  const [activeToolKey, setActiveToolKey] = useState<ToolKey | null>(null);
  const [activeToolTab, setActiveToolTab] = useState<ToolTabKey>("disaster");
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
  const [editingObject, setEditingObject] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingObject, setDeletingObject] = useState(false);
  const [boundaryQuery, setBoundaryQuery] = useState("");
  const [boundaryResults, setBoundaryResults] = useState<BoundaryResult[]>([]);
  const [boundaryLoading, setBoundaryLoading] = useState(false);
  const [boundaryError, setBoundaryError] = useState("");
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRouteState>({
    loading: false,
    error: "",
    target: null,
    distanceM: null,
    durationS: null,
    geometry: null,
  });
  const [routeTargetId, setRouteTargetId] = useState("nearest-road");
  const [nearbyRadiusM, setNearbyRadiusM] = useState(10000);
  const [travelSpeedKmh, setTravelSpeedKmh] = useState(40);
  const [nearbyCandidates, setNearbyCandidates] = useState<NearbyCandidate[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const activeTool = useMemo(() => tools.find((tool) => tool.key === activeToolKey) ?? null, [activeToolKey]);
  const activeTabTools = useMemo(() => {
    const tab = toolTabs.find((item) => item.key === activeToolTab) ?? toolTabs[0];
    return tools.filter((tool) => tab.toolKeys.includes(tool.key));
  }, [activeToolTab]);
  const boundaryImportTool = useMemo(() => {
    const key: ToolKey = activeToolTab === "disaster" ? "disaster_polygon" : "land_polygon";
    return tools.find((tool) => tool.key === key) ?? tools[0];
  }, [activeToolTab]);
  const layerById = useMemo(() => new Map(layers.map((layer) => [layer.id, layer])), [layers]);
  const layerByType = useMemo(() => new Map(layers.map((layer) => [layer.layerType, layer])), [layers]);
  const riskById = useMemo(() => new Map(riskLevels.map((risk) => [risk.id, risk])), [riskLevels]);

  const visibleObjects = objects.filter((object) => {
    const layer = layerById.get(object.layerId);
    if (!layer) return false;
    return visibleOverlays[layer.layerType] ?? true;
  });

  const evacuationCandidates = useMemo(() => {
    return objects.filter((object) => {
      const layer = layerById.get(object.layerId);
      return layer?.layerType === "mitigation_resource" && Boolean(objectPoint(object));
    });
  }, [layerById, objects]);
  const routeCandidates = useMemo(() => {
    return nearbyCandidates.length ? nearbyCandidates : evacuationCandidates;
  }, [evacuationCandidates, nearbyCandidates]);

  const exportObjects = useMemo(() => {
    const draftLayer = draft ? layerByType.get(draft.tool.layerType) : null;
    if (!draft || !draftLayer) return visibleObjects;
    return [
      ...visibleObjects,
      {
        id: -1,
        projectId,
        layerId: draftLayer.id,
        categoryId: null,
        riskLevelId: null,
        name: draft.tool.label,
        label: null,
        objectType: draft.tool.objectType,
        geometryType: draft.tool.geometryType,
        areaSize: draft.areaSize,
        lengthSize: draft.lengthSize,
        latitude: draft.latitude,
        longitude: draft.longitude,
        description: null,
        notes: null,
        geometry: draft.geometry,
        metadata: draft.radiusSize ? { radius_m: draft.radiusSize } : {},
        styleConfig: null,
        createdAt: "",
        updatedAt: "",
      } satisfies WorkspaceMapObject,
    ];
  }, [draft, layerByType, projectId, visibleObjects]);

  const getObjectColor = useCallback((object: WorkspaceMapObject) => {
    if (object.id === -1 && draft) return layerColor(draft.tool.layerType);
    const layer = layerById.get(object.layerId);
    const risk = object.riskLevelId ? riskById.get(object.riskLevelId) : null;
    return layerColor(layer?.layerType, risk);
  }, [draft, layerById, riskById]);

  const pdfLegendEntries = useMemo(() => {
    const entries = new Map<string, ReportLegendEntry>();
    exportObjects.forEach((object) => {
      const layer = layerById.get(object.layerId);
      const risk = object.riskLevelId ? riskById.get(object.riskLevelId) : null;
      const color = getObjectColor(object);
      const label = risk ? `${layer?.name ?? "Risiko"} - ${risk.name}` : layer?.name ?? object.objectType.replace(/_/g, " ");
      const key = `${label}-${color}`;
      const current = entries.get(key);
      entries.set(key, {
        label,
        color,
        count: (current?.count ?? 0) + 1,
      });
    });
    return Array.from(entries.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [exportObjects, getObjectColor, layerById, riskById]);

  const pdfInfoLines = useMemo(() => {
    const countByLayer = (layerType: LayerType) => exportObjects.filter((object) => layerById.get(object.layerId)?.layerType === layerType).length;
    const totalAreaHa = exportObjects.reduce((sum, object) => sum + Number(object.areaSize ?? 0), 0) / 10000;
    const highRiskCount = exportObjects.filter((object) => {
      const risk = object.riskLevelId ? riskById.get(object.riskLevelId) : null;
      return (risk?.score ?? 0) >= 4;
    }).length;
    const selectedLayer = selectedObject ? layerById.get(selectedObject.layerId) : null;
    const selectedRisk = selectedObject?.riskLevelId ? riskById.get(selectedObject.riskLevelId) : null;
    const lines = [
      `SIGMANTA GIS - ${projectName}`,
      `Lokasi: ${projectLocation}`,
      `Objek terlihat: ${exportObjects.length}`,
      `Luas terlihat: ${totalAreaHa.toFixed(2)} Ha`,
      `Risiko tinggi: ${highRiskCount}`,
      `Rawan bencana: ${countByLayer("disaster_risk")} | Segmentasi: ${countByLayer("land_segmentation")}`,
      `Titik mitigasi: ${countByLayer("mitigation_resource")} | Marker: ${countByLayer("marker_label")}`,
    ];

    if (selectedObject) {
      lines.push(`Fokus: ${selectedObject.name}`);
      lines.push(`Layer: ${selectedLayer?.name ?? selectedObject.objectType}${selectedRisk ? ` | Risiko: ${selectedRisk.name}` : ""}`);
      lines.push(`Ukuran: ${objectSummary(selectedObject)}`);
    }

    return lines;
  }, [exportObjects, layerById, projectLocation, projectName, riskById, selectedObject]);

  const pdfRiskEntries = useMemo(() => {
    const entries = new Map<string, ReportListEntry & { count: number; areaHa: number }>();
    exportObjects.forEach((object) => {
      const layer = layerById.get(object.layerId);
      if (!isDisasterObject(object, layer)) return;
      const risk = object.riskLevelId ? riskById.get(object.riskLevelId) : null;
      const key = risk?.code ?? "unknown";
      const current = entries.get(key) ?? {
        label: risk?.name ?? "Belum dinilai",
        value: "",
        color: risk?.color ?? "#888780",
        count: 0,
        areaHa: 0,
      };
      current.count += 1;
      current.areaHa += Number(object.areaSize ?? 0) / 10000;
      entries.set(key, current);
    });

    return Array.from(entries.values())
      .sort((left, right) => {
        const leftRisk = riskLevels.find((risk) => risk.name === left.label);
        const rightRisk = riskLevels.find((risk) => risk.name === right.label);
        return (rightRisk?.score ?? 0) - (leftRisk?.score ?? 0);
      })
      .map((entry) => ({
        label: entry.label,
        value: `${entry.count} zona, ${entry.areaHa.toFixed(2)} Ha`,
        color: entry.color,
      }));
  }, [exportObjects, layerById, riskById, riskLevels]);

  const pdfMitigationEntries = useMemo(() => {
    return exportObjects
      .filter((object) => {
        const layer = layerById.get(object.layerId);
        return layer?.layerType === "mitigation_resource" || layer?.layerType === "marker_label" || object.objectType === "resource_point" || object.objectType === "marker";
      })
      .slice(0, 12)
      .map((object) => {
        const layer = layerById.get(object.layerId);
        const point = objectPoint(object);
        return {
          label: object.label || object.name,
          value: `${layer?.name ?? object.objectType}${point ? `, ${point[1].toFixed(4)}, ${point[0].toFixed(4)}` : ""}`,
          color: getObjectColor(object),
        };
      });
  }, [exportObjects, getObjectColor, layerById]);

  useEffect(() => {
    let cancelled = false;

    async function loadNearbyCandidates() {
      if (!selectedObject) {
        setNearbyCandidates([]);
        setNearbyError("");
        setNearbyLoading(false);
        return;
      }

      const selectedLayer = layerById.get(selectedObject.layerId);
      if (!isDisasterObject(selectedObject, selectedLayer)) {
        setNearbyCandidates([]);
        setNearbyError("");
        setNearbyLoading(false);
        return;
      }

      const origin = objectPoint(selectedObject);
      if (!origin) {
        setNearbyCandidates([]);
        setNearbyError("Titik asal zona rawan tidak bisa dihitung untuk query PostGIS.");
        setNearbyLoading(false);
        return;
      }

      setNearbyLoading(true);
      setNearbyError("");

      try {
        const response = await fetch(`/api/projects/${projectId}/spatial/nearby?lat=${origin[1]}&lng=${origin[0]}&radius=${nearbyRadiusM}`, { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok) {
          setNearbyCandidates([]);
          setNearbyError(payload?.message ?? "Query PostGIS nearby gagal. Fallback browser dipakai.");
          return;
        }

        const objects = Array.isArray(payload?.objects) ? payload.objects : [];
        setNearbyCandidates(objects.filter((object: NearbyCandidate) => Boolean(objectPoint(object))));
        if (!objects.length) setNearbyError("Tidak ada titik mitigasi/marker dalam radius PostGIS. Fallback browser dipakai.");
      } catch {
        if (!cancelled) {
          setNearbyCandidates([]);
          setNearbyError("Query PostGIS nearby gagal. Fallback browser dipakai.");
        }
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    }

    void loadNearbyCandidates();
    return () => {
      cancelled = true;
    };
  }, [layerById, nearbyRadiusM, projectId, selectedObject]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function findEvacuationRoute() {
      if (!selectedObject) {
        setEvacuationRoute({ loading: false, error: "", target: null, distanceM: null, durationS: null, geometry: null });
        return;
      }

      const selectedLayer = layerById.get(selectedObject.layerId);
      if (!isDisasterObject(selectedObject, selectedLayer)) {
        setEvacuationRoute({ loading: false, error: "", target: null, distanceM: null, durationS: null, geometry: null });
        return;
      }

      const origin = objectPoint(selectedObject);
      const originCandidates = evacuationOriginCandidates(selectedObject);
      if (!origin || !originCandidates.length) {
        setEvacuationRoute({ loading: false, error: "Titik akses zona rawan tidak bisa dihitung.", target: null, distanceM: null, durationS: null, geometry: null });
        return;
      }

      const candidates = routeCandidates
        .map((object): RouteCandidate | null => {
          const point = objectPoint(object);
          if (!point) return null;
          return {
            object,
            point,
            directDistanceM: haversineDistanceMeters(origin, point),
          };
        })
        .filter((candidate): candidate is RouteCandidate => candidate !== null)
        .sort((left, right) => left.directDistanceM - right.directDistanceM);

      if (!candidates.length) {
        setEvacuationRoute({ loading: false, error: "Belum ada titik evakuasi/titik mitigasi untuk dihitung.", target: null, distanceM: null, durationS: null, geometry: null });
        return;
      }

      const selectedTargetId = routeTargetId === "nearest-road" ? null : Number(routeTargetId);
      const selectedCandidate = selectedTargetId !== null && Number.isFinite(selectedTargetId)
        ? candidates.find((candidate) => candidate.object.id === selectedTargetId) ?? null
        : null;

      if (selectedTargetId !== null && !selectedCandidate) {
        setEvacuationRoute({ loading: false, error: "Titik evakuasi yang dipilih tidak tersedia dalam kandidat saat ini.", target: null, distanceM: null, durationS: null, geometry: null });
        return;
      }

      // Haversine hanya digunakan untuk membatasi jumlah kandidat yang dikirim ke router.
      // Pemilihan tujuan otomatis tetap ditentukan dari jarak jaringan jalan oleh API routing.
      const routingCandidates = (selectedCandidate ? [selectedCandidate] : candidates.slice(0, 25));

      setEvacuationRoute({ loading: true, error: "", target: null, distanceM: null, durationS: null, geometry: null });

      try {
        const response = await fetch("/api/routing/evacuation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({
            origin,
            originCandidates,
            targetId: selectedCandidate?.object.id ?? null,
            destinations: routingCandidates.map((candidate) => ({
              id: candidate.object.id,
              name: candidate.object.name,
              coordinates: candidate.point,
            })),
          }),
        });

        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok || !payload?.route) {
          setEvacuationRoute({
            loading: false,
            error: payload?.message ?? "Rute jaringan jalan gagal dihitung.",
            target: null,
            distanceM: null,
            durationS: null,
            geometry: null,
          });
          return;
        }

        const target = candidates.find((candidate) => candidate.object.id === Number(payload.route.targetId))?.object ?? null;
        if (!target) {
          setEvacuationRoute({
            loading: false,
            error: "Hasil routing tidak cocok dengan titik evakuasi yang tersedia.",
            target: null,
            distanceM: null,
            durationS: null,
            geometry: null,
          });
          return;
        }

        const distanceM = Number(payload.route.distanceM);
        const durationS = Number(payload.route.durationS);
        const geometry = payload.route.geometry as Feature | undefined;

        if (!Number.isFinite(distanceM) || !Number.isFinite(durationS) || geometry?.geometry?.type !== "LineString") {
          setEvacuationRoute({
            loading: false,
            error: "Data rute yang diterima dari layanan routing tidak valid.",
            target: null,
            distanceM: null,
            durationS: null,
            geometry: null,
          });
          return;
        }

        setEvacuationRoute({
          loading: false,
          error: "",
          target,
          distanceM,
          durationS,
          geometry,
        });
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setEvacuationRoute({
          loading: false,
          error: "Layanan routing jalan tidak dapat dihubungi. Periksa koneksi atau konfigurasi OSRM_BASE_URL.",
          target: null,
          distanceM: null,
          durationS: null,
          geometry: null,
        });
      }
    }

    void findEvacuationRoute();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [layerById, routeCandidates, routeTargetId, selectedObject]);

  const handleMapReady = useCallback((map: L.Map | null) => {
    mapRef.current = map;
  }, []);

  const selectObject = useCallback((object: WorkspaceMapObject) => {
    setSelectedObject(object);
    setEditingObject(false);
    setEditError("");
  }, []);

  const exportCurrentPdf = useCallback(async () => {
    const map = mapRef.current;
    if (!map) {
      dispatchWorkspaceAction("pdf", "error", "Peta belum siap untuk diexport.");
      return;
    }

    dispatchWorkspaceAction("pdf", "pending", "Membuat PDF peta...");
    try {
      await exportLeafletReportPdf(map, exportObjects, getObjectColor, {
        projectName,
        projectLocation,
        exporterName,
        infoLines: pdfInfoLines,
        legendEntries: pdfLegendEntries,
        riskEntries: pdfRiskEntries,
        mitigationEntries: pdfMitigationEntries,
      });
      dispatchWorkspaceAction("pdf", "success", "PDF peta berhasil didownload.");
    } catch (error) {
      dispatchWorkspaceAction("pdf", "error", error instanceof Error ? error.message : "Export PDF gagal.");
    }
  }, [exportObjects, exporterName, getObjectColor, pdfInfoLines, pdfLegendEntries, pdfMitigationEntries, pdfRiskEntries, projectLocation, projectName]);

  const saveProjectView = useCallback(async () => {
    const map = mapRef.current;
    if (!map) {
      dispatchWorkspaceAction("save", "error", "Peta belum siap untuk disimpan.");
      return;
    }

    const centerPoint = map.getCenter();
    dispatchWorkspaceAction("save", "pending", "Menyimpan view project...");
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        centerLat: centerPoint.lat,
        centerLng: centerPoint.lng,
        defaultZoom: map.getZoom(),
        viewConfig: {
          visibleOverlays,
          activeToolKey,
          savedAt: new Date().toISOString(),
        },
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      dispatchWorkspaceAction("save", "error", data?.message ?? "View project gagal disimpan.");
      return;
    }

    dispatchWorkspaceAction("save", "success", `Last saved: ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
  }, [activeToolKey, projectId, visibleOverlays]);

  useEffect(() => {
    const handleWorkspaceCommand = (event: Event) => {
      const command = (event as WorkspaceCommandEvent).detail;
      if (command.type === "pdf") void exportCurrentPdf();
      if (command.type === "save") void saveProjectView();
    };

    window.addEventListener("sigmanta:workspace-command", handleWorkspaceCommand);
    return () => window.removeEventListener("sigmanta:workspace-command", handleWorkspaceCommand);
  }, [exportCurrentPdf, saveProjectView]);

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const form = new FormData(event.currentTarget);
    const layer = layerByType.get(draft.tool.layerType);
    if (!layer) {
      setSaveError("Layer untuk tool ini belum tersedia. Buat ulang default layer project.");
      return;
    }

    const objectMetadata = draft.radiusSize ? { radius_m: draft.radiusSize } : {};

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

  async function updateSelectedObject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedObject) return;

    const form = new FormData(event.currentTarget);
    setEditing(true);
    setEditError("");

    const response = await fetch(`/api/map-objects/${selectedObject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        label: String(form.get("label") ?? "") || null,
        categoryId: Number(form.get("categoryId")) || null,
        riskLevelId: Number(form.get("riskLevelId")) || null,
        description: String(form.get("description") ?? "") || null,
        notes: String(form.get("notes") ?? "") || null,
      }),
    });

    const data = await response.json().catch(() => null);
    setEditing(false);

    if (!response.ok) {
      setEditError(data?.message ?? "Objek gagal diperbarui.");
      return;
    }

    setObjects((current) => current.map((object) => (object.id === selectedObject.id ? data.object : object)));
    setSelectedObject(data.object);
    setEditingObject(false);
  }

  async function deleteSelectedObject() {
    if (!selectedObject || deletingObject) return;
    setDeletingObject(true);
    setEditError("");
    const response = await fetch(`/api/map-objects/${selectedObject.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    setDeletingObject(false);

    if (!response.ok) {
      setEditError(data?.message ?? "Objek gagal dihapus.");
      return;
    }

    setObjects((current) => current.filter((object) => object.id !== selectedObject.id));
    setSelectedObject(null);
    setEditingObject(false);
  }

  async function searchBoundaries(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBoundaryLoading(true);
    setBoundaryError("");

    const response = await fetch(`/api/geocode/boundary?q=${encodeURIComponent(boundaryQuery)}`);
    const data = await response.json().catch(() => null);
    setBoundaryLoading(false);

    if (!response.ok) {
      setBoundaryResults([]);
      setBoundaryError(data?.message ?? "Batas wilayah gagal dicari.");
      return;
    }

    setBoundaryResults(data.results ?? []);
    if (!data.results?.length) setBoundaryError("Boundary polygon tidak ditemukan untuk kata kunci tersebut.");
  }

  function useBoundaryAsDraft(result: BoundaryResult) {
    const geometry = result.geojson;
    const areaSize = Math.round(turf.area(geometry) * 100) / 100;
    const center = turf.centroid(geometry);
    const [longitude, latitude] = center.geometry.coordinates;

    setActiveToolTab(boundaryImportTool.layerType === "disaster_risk" ? "disaster" : "segmentation");
    setActiveToolKey(boundaryImportTool.key);
    setVisibleOverlays((current) => ({ ...current, [boundaryImportTool.layerType]: true }));
    setSelectedObject(null);
    setEditingObject(false);
    setDraft({
      tool: boundaryImportTool,
      geometry,
      areaSize,
      lengthSize: null,
      radiusSize: null,
      latitude,
      longitude,
    });

    const map = mapRef.current;
    if (map) {
      const bounds = L.geoJSON(geometry).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.12));
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-66px)] border-t-2 border-earth-dark bg-earth-light md:h-[calc(100vh-66px)] md:grid-cols-[300px_1fr_340px] md:overflow-hidden">
      <aside className="topographic-paper flex max-h-[78vh] min-h-0 flex-col overflow-y-auto border-b-2 border-earth-dark p-5 md:max-h-none md:border-b-0 md:border-r-2">
        <div>
          <h2 className="font-display text-3xl font-black">{projectName}</h2>
          <p className="label-mono mt-2 text-earth-dark/65">{projectLocation}</p>
        </div>

        <nav className="mt-7 space-y-3">
          {[
            { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
            { label: "Projects", icon: FolderOpen, href: "/projects" },
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
            <p className="label-mono mb-3">Layer</p>
            {layers.filter((layer) => layer.layerType !== "evacuation_route").map((layer) => (
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
            <p className="mb-3 text-xs leading-5 text-earth-dark/60">
              Snapping aktif: titik baru bisa menempel ke vertex atau sisi objek yang sudah ada untuk batas area yang lebih presisi.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {toolTabs.map((tab) => {
                const active = activeToolTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    className={`border-2 px-3 py-2 text-left text-[11px] font-bold uppercase leading-4 tracking-[0.06em] ${
                      active ? "border-earth-dark bg-moss-light shadow-[2px_2px_0_#1c1a14]" : "border-earth-dark/20 bg-earth-paper text-earth-dark/65"
                    }`}
                    onClick={() => {
                      setActiveToolTab(tab.key);
                      setActiveToolKey(null);
                      setDraft(null);
                    }}
                    type="button"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-2">
              {activeTabTools.map((tool) => {
                const Icon = tool.icon;
                const active = activeToolKey === tool.key;
                return (
                  <button
                    key={tool.key}
                    onClick={() => {
                      setActiveToolKey(tool.key);
                      setDraft(null);
                      setVisibleOverlays((current) => ({ ...current, [tool.layerType]: true }));
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
            <div className="mt-4 border-t-2 border-earth-dark/20 pt-4">
              <p className="label-mono text-earth-dark/70">Ambil Batas Wilayah</p>
              <p className="mt-2 text-xs leading-5 text-earth-dark/58">
                Cari boundary OSM untuk membuat draft polygon mengikuti bentuk wilayah di peta.
              </p>
              <form onSubmit={searchBoundaries} className="mt-3 flex gap-2">
                <input
                  className="min-w-0 flex-1 border-2 border-earth-dark bg-earth-light px-3 py-2 text-sm outline-none"
                  onChange={(event) => setBoundaryQuery(event.target.value)}
                  placeholder="Contoh: Kemiling"
                  value={boundaryQuery}
                />
                <button className="brutal-button bg-earth-dark px-3 py-2 text-earth-light" disabled={boundaryLoading} type="submit" aria-label="Cari batas wilayah">
                  <Search size={16} />
                </button>
              </form>
              {boundaryError ? <p className="mt-3 border-2 border-hazard bg-hazard-light p-3 text-xs leading-5 text-hazard">{boundaryError}</p> : null}
              {boundaryResults.length ? (
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {boundaryResults.map((result) => (
                    <button
                      key={result.id}
                      className="w-full border-2 border-earth-dark/25 bg-earth-paper px-3 py-2 text-left text-xs hover:border-earth-dark hover:bg-moss-light"
                      onClick={() => useBoundaryAsDraft(result)}
                      type="button"
                    >
                      <span className="block font-bold leading-5">{result.name}</span>
                      <span className="mt-1 block uppercase tracking-[0.06em] text-earth-dark/55">
                        {result.osmClass || "boundary"} · {result.osmType || "polygon"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t-2 border-earth-dark pt-5">
          <a href="/settings" className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.06em] text-earth-dark/70">
            <Settings size={18} /> Manage Users
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
            Tool: <span className="font-bold">{activeTool?.label ?? "Pilih tool"}</span>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 z-[500] border border-earth-dark/20 bg-earth-light px-3 py-2 text-xs shadow-sm">
          {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E | {objects.length} objek
        </div>
        <MapContainer center={center} zoom={zoom} className="h-full w-full">
          <MapReady onReady={handleMapReady} />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            crossOrigin="anonymous"
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {visibleObjects.map((object) => {
            const layer = layerById.get(object.layerId);
            const risk = object.riskLevelId ? riskById.get(object.riskLevelId) : null;
            const color = layerColor(layer?.layerType, risk);
            const radius = getMetadataRadius(object.metadata);
            const tooltip = objectTooltipText(object, layer, risk);

            if (object.geometryType === "circle" && object.latitude && object.longitude && radius) {
              return (
                <LeafletCircle
                  key={`${object.id}-${object.updatedAt}`}
                  center={[object.latitude, object.longitude]}
                  radius={radius}
                  eventHandlers={{ click: () => selectObject(object) }}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.16, weight: 2 }}
                >
                  <Tooltip sticky direction="top" opacity={0.96}>
                    <div className="max-w-64">
                      <p className="font-bold">{tooltip.title}</p>
                      <p className="mt-1 text-xs">{tooltip.type}</p>
                      <p className="mt-2 text-xs leading-5">{tooltip.summary}</p>
                    </div>
                  </Tooltip>
                </LeafletCircle>
              );
            }

            if (object.geometry.geometry.type === "Point" && object.latitude && object.longitude) {
              return (
                <Marker key={object.id} position={[object.latitude, object.longitude]} eventHandlers={{ click: () => selectObject(object) }}>
                  <Tooltip sticky direction="top" opacity={0.96}>
                    <div className="max-w-64">
                      <p className="font-bold">{tooltip.title}</p>
                      <p className="mt-1 text-xs">{tooltip.type}</p>
                      <p className="mt-2 text-xs leading-5">{tooltip.summary}</p>
                    </div>
                  </Tooltip>
                  <Popup>{object.name}</Popup>
                </Marker>
              );
            }

            return (
              <GeoJSONLayer
                key={`${object.id}-${object.updatedAt}`}
                data={object.geometry}
                eventHandlers={{ click: () => selectObject(object) }}
                style={() => ({
                  color,
                  weight: layer?.layerType === "evacuation_route" ? 4 : 2,
                  fillColor: color,
                  fillOpacity: layer?.layerType === "disaster_risk" ? 0.14 : 0.22,
                  dashArray: layer?.layerType === "evacuation_route" ? "8 6" : undefined,
                })}
              >
                <Tooltip sticky direction="top" opacity={0.96}>
                  <div className="max-w-64">
                    <p className="font-bold">{tooltip.title}</p>
                    <p className="mt-1 text-xs">{tooltip.type}</p>
                    <p className="mt-2 text-xs leading-5">{tooltip.summary}</p>
                  </div>
                </Tooltip>
              </GeoJSONLayer>
            );
          })}
          {evacuationRoute.geometry ? (
            <GeoJSONLayer
              key={`evacuation-route-${evacuationRoute.target?.id ?? "none"}-${selectedObject?.id ?? "none"}`}
              data={evacuationRoute.geometry}
              style={() => ({
                color: "#185FA5",
                weight: 6,
                opacity: 0.92,
                lineCap: "round",
                lineJoin: "round",
              })}
            >
              <Tooltip sticky direction="top" opacity={0.96}>
                <div className="max-w-64">
                  <p className="font-bold">Evakuasi - Rute Jalan</p>
                  <p className="mt-1 text-xs">{evacuationRoute.target?.name}</p>
                  <p className="mt-2 text-xs leading-5">
                    {formatDistance(evacuationRoute.distanceM)} · {formatDuration(evacuationRoute.durationS)}
                  </p>
                </div>
              </Tooltip>
            </GeoJSONLayer>
          ) : null}
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
              setEditingObject(false);
            }}
          />
        </MapContainer>
      </section>

      <aside className="topographic-paper flex max-h-[78vh] min-h-0 flex-col overflow-hidden border-t-2 border-earth-dark md:max-h-none md:border-l-2 md:border-t-0">
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
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm min-[1180px]:grid-cols-3">
                  <div className="min-w-0 border border-earth-dark/15 bg-earth-paper px-3 py-2">
                    <p className="text-xs text-earth-dark/55">Luas</p>
                    <p className="mt-1 break-words text-sm font-bold leading-5">{draft.areaSize ? `${(draft.areaSize / 10000).toFixed(2)} Ha` : "-"}</p>
                  </div>
                  <div className="min-w-0 border border-earth-dark/15 bg-earth-paper px-3 py-2">
                    <p className="text-xs text-earth-dark/55">Circle</p>
                    <p className="mt-1 break-words text-sm font-bold leading-5">{draft.radiusSize ? `${Math.round(draft.radiusSize)} m` : "-"}</p>
                  </div>
                  <div className="min-w-0 border border-earth-dark/15 bg-earth-paper px-3 py-2">
                    <p className="text-xs text-earth-dark/55">Panjang</p>
                    <p className="mt-1 break-words text-sm font-bold leading-5">{draft.lengthSize ? `${Math.round(draft.lengthSize)} m` : "-"}</p>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="label-mono">Survey Notes</span>
                <textarea name="notes" className="mt-2 min-h-24 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" placeholder="Catatan lapangan" />
              </label>
              {saveError ? <p className="border-2 border-hazard bg-hazard-light p-3 text-sm text-hazard">{saveError}</p> : null}
              <button className="brutal-button w-full bg-earth-dark px-4 py-3 text-earth-light" disabled={saving}>
                <Save size={17} /> {saving ? "Menyimpan..." : "Simpan Objek"}
              </button>
            </form>
          ) : selectedObject ? (
            <div className="space-y-6">
              {editingObject ? (
                <form onSubmit={updateSelectedObject} className="space-y-4">
                  <div className="brutal-card bg-earth-light p-4">
                    <p className="label-mono text-moss">Edit Objek</p>
                    <label className="mt-4 block">
                      <span className="label-mono">Nama Objek</span>
                      <input name="name" required defaultValue={selectedObject.name} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" />
                    </label>
                    <label className="mt-4 block">
                      <span className="label-mono">Label Peta</span>
                      <input name="label" defaultValue={selectedObject.label ?? ""} className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" />
                    </label>
                    <label className="mt-4 block">
                      <span className="label-mono">Kategori</span>
                      <select name="categoryId" className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" defaultValue={selectedObject.categoryId ?? ""}>
                        <option value="">Tidak dipilih</option>
                        {(layerById.get(selectedObject.layerId)?.categories ?? []).map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </label>
                    {layerById.get(selectedObject.layerId)?.layerType === "disaster_risk" ? (
                      <label className="mt-4 block">
                        <span className="label-mono">Tingkat Risiko</span>
                        <select name="riskLevelId" className="mt-2 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" defaultValue={selectedObject.riskLevelId ?? ""}>
                          <option value="">Pilih risiko</option>
                          {riskLevels.map((risk) => (
                            <option key={risk.id} value={risk.id}>{risk.name}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>

                  <label className="block">
                    <span className="label-mono">Deskripsi</span>
                    <textarea name="description" defaultValue={selectedObject.description ?? ""} className="mt-2 min-h-20 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" />
                  </label>
                  <label className="block">
                    <span className="label-mono">Survey Notes</span>
                    <textarea name="notes" defaultValue={selectedObject.notes ?? ""} className="mt-2 min-h-24 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" />
                  </label>
                  {editError ? <p className="border-2 border-hazard bg-hazard-light p-3 text-sm text-hazard">{editError}</p> : null}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="brutal-button bg-earth-dark px-4 py-3 text-earth-light" disabled={editing} type="submit">
                      <Save size={17} /> {editing ? "Menyimpan..." : "Simpan"}
                    </button>
                    <button className="brutal-button bg-earth-light px-4 py-3" onClick={() => setEditingObject(false)} type="button">
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <>
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
                <button className="brutal-button mt-5 w-full bg-earth-light px-4 py-3" onClick={() => setEditingObject(true)} type="button">
                  Edit Objek
                </button>
                {editError ? <p className="mt-3 border-2 border-hazard bg-hazard-light p-3 text-sm text-hazard">{editError}</p> : null}
                <button
                  className="brutal-button mt-3 w-full bg-hazard px-4 py-3 text-earth-light disabled:opacity-60"
                  disabled={deletingObject}
                  onClick={() => {
                    if (window.confirm("Hapus objek peta ini?")) void deleteSelectedObject();
                  }}
                  type="button"
                >
                  <Trash2 size={17} /> {deletingObject ? "Menghapus..." : "Hapus Objek"}
                </button>
              </div>
              {(() => {
                const selectedLayer = layerById.get(selectedObject.layerId);
                const isDisasterArea = selectedLayer?.layerType === "disaster_risk" || selectedObject.objectType === "disaster_area" || selectedObject.objectType === "radius_area";
                if (!isDisasterArea) return null;

                return (
                  <div>
                    <p className="label-mono mb-3">Evakuasi - Rute Jalan</p>
                    <div className="brutal-card bg-earth-light p-4 text-sm">
                      {evacuationRoute.loading ? (
                        <p className="text-earth-dark/65">Menghitung rute melalui jaringan jalan...</p>
                      ) : evacuationRoute.error ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-bold uppercase text-earth-dark/55">Dari</p>
                              <p className="mt-1 border border-earth-dark/15 bg-earth-paper px-3 py-2 font-bold">{selectedObject.name}</p>
                            </div>
                            <div className="border border-earth-dark/15 bg-earth-paper p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold uppercase text-earth-dark/55">Titik terdekat</span>
                                <label className="flex items-center gap-2 text-xs">
                                  Radius
                                  <select
                                    className="border border-earth-dark bg-earth-light px-2 py-1 outline-none"
                                    onChange={(event) => setNearbyRadiusM(Number(event.target.value))}
                                    value={nearbyRadiusM}
                                  >
                                    <option value={1000}>1 km</option>
                                    <option value={5000}>5 km</option>
                                    <option value={10000}>10 km</option>
                                    <option value={25000}>25 km</option>
                                    <option value={50000}>50 km</option>
                                  </select>
                                </label>
                              </div>
                              {nearbyLoading ? <p className="mt-2 text-xs text-earth-dark/60">Mengambil kandidat dari PostGIS...</p> : null}
                              {nearbyError ? <p className="mt-2 text-xs leading-5 text-hazard">{nearbyError}</p> : null}
                              {nearbyCandidates.length ? (
                                <div className="mt-2 space-y-1.5">
                                  {nearbyCandidates.slice(0, 5).map((candidate) => (
                                    <button
                                      key={`nearby-error-${candidate.id}`}
                                      className="flex w-full items-center justify-between gap-2 border border-earth-dark/15 bg-earth-light px-2 py-1.5 text-left hover:border-earth-dark"
                                      onClick={() => setRouteTargetId(String(candidate.id))}
                                      type="button"
                                    >
                                      <span className="min-w-0 truncate font-bold">{candidate.name}</span>
                                      <span className="shrink-0 text-earth-dark/60">{formatDistance(candidate.distanceM)} radius</span>
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <label className="block">
                              <span className="text-xs font-bold uppercase text-earth-dark/55">Ke</span>
                              <select
                                className="mt-1 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 font-bold outline-none"
                                onChange={(event) => setRouteTargetId(event.target.value)}
                                value={routeTargetId}
                              >
                                <option value="nearest-road">Rute tercepat melalui jalan</option>
                                {routeCandidates.map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="text-xs font-bold uppercase text-earth-dark/55">Kecepatan Asumsi</span>
                              <select
                                className="mt-1 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 font-bold outline-none"
                                onChange={(event) => setTravelSpeedKmh(Number(event.target.value))}
                                value={travelSpeedKmh}
                              >
                                <option value={10}>10 km/h</option>
                                <option value={20}>20 km/h</option>
                                <option value={40}>40 km/h</option>
                                <option value={80}>80 km/h</option>
                              </select>
                            </label>
                          </div>
                          <p className="border-2 border-hazard bg-hazard-light p-3 text-hazard">{evacuationRoute.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-bold uppercase text-earth-dark/55">Dari</p>
                              <p className="mt-1 border border-earth-dark/15 bg-earth-paper px-3 py-2 font-bold">{selectedObject.name}</p>
                            </div>
                            <div className="border border-earth-dark/15 bg-earth-paper p-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold uppercase text-earth-dark/55">Titik terdekat</span>
                                <label className="flex items-center gap-2 text-xs">
                                  Radius
                                  <select
                                    className="border border-earth-dark bg-earth-light px-2 py-1 outline-none"
                                    onChange={(event) => setNearbyRadiusM(Number(event.target.value))}
                                    value={nearbyRadiusM}
                                  >
                                    <option value={1000}>1 km</option>
                                    <option value={5000}>5 km</option>
                                    <option value={10000}>10 km</option>
                                    <option value={25000}>25 km</option>
                                    <option value={50000}>50 km</option>
                                  </select>
                                </label>
                              </div>
                              {nearbyLoading ? <p className="mt-2 text-xs text-earth-dark/60">Mengambil kandidat dari PostGIS...</p> : null}
                              {nearbyError ? <p className="mt-2 text-xs leading-5 text-hazard">{nearbyError}</p> : null}
                              {nearbyCandidates.length ? (
                                <div className="mt-2 space-y-1.5">
                                  {nearbyCandidates.slice(0, 5).map((candidate) => (
                                    <button
                                      key={`nearby-success-${candidate.id}`}
                                      className="flex w-full items-center justify-between gap-2 border border-earth-dark/15 bg-earth-light px-2 py-1.5 text-left hover:border-earth-dark"
                                      onClick={() => setRouteTargetId(String(candidate.id))}
                                      type="button"
                                    >
                                      <span className="min-w-0 truncate font-bold">{candidate.name}</span>
                                      <span className="shrink-0 text-earth-dark/60">{formatDistance(candidate.distanceM)} radius</span>
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <label className="block">
                              <span className="text-xs font-bold uppercase text-earth-dark/55">Ke</span>
                              <select
                                className="mt-1 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 font-bold outline-none"
                                onChange={(event) => setRouteTargetId(event.target.value)}
                                value={routeTargetId}
                              >
                                <option value="nearest-road">Rute tercepat melalui jalan</option>
                                {routeCandidates.map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="text-xs font-bold uppercase text-earth-dark/55">Kecepatan Asumsi</span>
                              <select
                                className="mt-1 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 font-bold outline-none"
                                onChange={(event) => setTravelSpeedKmh(Number(event.target.value))}
                                value={travelSpeedKmh}
                              >
                                <option value={10}>10 km/h</option>
                                <option value={20}>20 km/h</option>
                                <option value={40}>40 km/h</option>
                                <option value={80}>80 km/h</option>
                              </select>
                            </label>
                          </div>
                          {evacuationRoute.target ? (
                            <div className="space-y-4">
                              <div className="flex items-start gap-3 border-t border-earth-dark/15 pt-4">
                                <Route className="mt-1 shrink-0 text-water" size={20} />
                                <div className="min-w-0">
                                  <p className="font-bold leading-6">{evacuationRoute.target.name}</p>
                                  <p className="mt-1 text-xs leading-5 text-earth-dark/60">
                                    {routeTargetId === "nearest-road" ? "Sistem menguji beberapa titik akses di tepi zona dan memilih kombinasi dengan durasi perjalanan OSRM paling singkat." : "Tujuan dipilih manual, sedangkan jalurnya tetap mengikuti jaringan jalan."}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3 min-[1180px]:grid-cols-2">
                                <div className="border border-earth-dark/15 bg-earth-paper px-3 py-2">
                                  <p className="text-xs text-earth-dark/55">Jarak Rute Jalan</p>
                                  <p className="mt-1 font-bold">{formatDistance(evacuationRoute.distanceM)}</p>
                                </div>
                                <div className="border border-earth-dark/15 bg-earth-paper px-3 py-2">
                                  <p className="text-xs text-earth-dark/55">Durasi Routing OSRM</p>
                                  <p className="mt-1 font-bold">{formatDuration(evacuationRoute.durationS)}</p>
                                </div>
                                {vehicleEstimates(evacuationRoute.distanceM, travelSpeedKmh).map((estimate) => (
                                  <div key={estimate.label} className="border border-earth-dark/15 bg-earth-paper px-3 py-2">
                                    <p className="text-xs text-earth-dark/55">{estimate.label}</p>
                                    <p className="mt-1 font-bold">{estimate.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-earth-dark/65">Pilih zona rawan bencana dan titik evakuasi untuk menampilkan rute.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div>
                <p className="label-mono mb-3">Survey Notes</p>
                <div className="brutal-card min-h-24 bg-earth-light p-4 text-sm leading-6">
                  {selectedObject.notes || "Belum ada catatan."}
                </div>
              </div>
              <div>
                <p className="label-mono mb-3">Ringkasan Geometri</p>
                <div className="brutal-card bg-earth-light p-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="label-mono text-earth-dark/55">Tipe</p>
                      <p className="mt-1 font-bold">{selectedObject.geometry.geometry.type}</p>
                    </div>
                    <div>
                      <p className="label-mono text-earth-dark/55">Titik Koordinat</p>
                      <p className="mt-1 font-bold">{objectCoordinateCount(selectedObject)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-earth-dark/60">
                    Data teknis GeoJSON disimpan di database dan dipakai sistem untuk menggambar ulang objek pada peta.
                  </p>
                </div>
              </div>
                </>
              )}
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
