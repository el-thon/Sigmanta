import { NextRequest } from "next/server";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMapObjectPostgis } from "@/lib/postgis";
import { errorResponse, success } from "@/lib/response";

const importGeoJsonSchema = z.object({
  layerType: z.enum(["land_segmentation", "disaster_risk", "marker_label", "mitigation_resource", "evacuation_route"]),
  categoryId: z.number().int().optional().nullable(),
  riskLevelId: z.number().int().optional().nullable(),
  namePrefix: z.string().optional(),
  featureCollection: z.unknown(),
});

function isFeatureCollection(value: unknown): value is FeatureCollection {
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "FeatureCollection" && Array.isArray((value as { features?: unknown }).features));
}

function supportedGeometryType(geometry: Geometry | null) {
  if (!geometry) return null;
  if (geometry.type === "Point") return "point";
  if (geometry.type === "LineString") return "linestring";
  if (geometry.type === "Polygon") return "polygon";
  return null;
}

function objectTypeFor(layerType: z.infer<typeof importGeoJsonSchema>["layerType"], geometryType: "point" | "linestring" | "polygon") {
  if (geometryType === "point") {
    if (layerType === "mitigation_resource") return "resource_point";
    return "marker";
  }
  if (geometryType === "linestring") return "route";
  if (layerType === "disaster_risk") return "disaster_area";
  if (layerType === "marker_label") return "marker";
  if (layerType === "mitigation_resource") return "resource_point";
  return "land_segment";
}

function featureName(feature: Feature, fallback: string) {
  const properties = feature.properties && typeof feature.properties === "object" ? feature.properties : {};
  const value = properties.name ?? properties.Name ?? properties.title ?? properties.label ?? fallback;
  return String(value).slice(0, 150);
}

function pointCoordinates(feature: Feature) {
  if (feature.geometry?.type !== "Point") return { latitude: null, longitude: null };
  const [longitude, latitude] = feature.geometry.coordinates.map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { latitude: null, longitude: null };
  return { latitude, longitude };
}

function objectMeasurements(feature: Feature, geometryType: "point" | "linestring" | "polygon") {
  if (geometryType === "polygon") return { areaSize: Math.round(turf.area(feature) * 100) / 100, lengthSize: null };
  if (geometryType === "linestring") return { areaSize: null, lengthSize: Math.round(turf.length(feature, { units: "meters" }) * 100) / 100 };
  return { areaSize: null, lengthSize: null };
}

function serializeObject(object: Awaited<ReturnType<typeof prisma.mapObject.findFirstOrThrow>>) {
  return {
    ...object,
    areaSize: object.areaSize ? Number(object.areaSize) : null,
    lengthSize: object.lengthSize ? Number(object.lengthSize) : null,
    latitude: object.latitude ? Number(object.latitude) : null,
    longitude: object.longitude ? Number(object.longitude) : null,
  };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return errorResponse("Project tidak valid", 422);

  const parsed = importGeoJsonSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("Input import GeoJSON tidak valid", 422);
  if (!isFeatureCollection(parsed.data.featureCollection)) return errorResponse("File harus berupa GeoJSON FeatureCollection", 422);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const layer = await prisma.projectLayer.findFirst({
    where: { projectId, layerType: parsed.data.layerType },
    select: { id: true, layerType: true },
  });
  if (!layer) return errorResponse("Layer tujuan tidak ditemukan", 422);

  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, layerId: layer.id },
      select: { id: true },
    });
    if (!category) return errorResponse("Kategori tidak valid untuk layer tujuan", 422);
  }

  if (parsed.data.riskLevelId) {
    const risk = await prisma.riskLevel.findUnique({
      where: { id: parsed.data.riskLevelId },
      select: { id: true },
    });
    if (!risk) return errorResponse("Tingkat risiko tidak valid", 422);
  }

  const skipped: string[] = [];
  const features = parsed.data.featureCollection.features.slice(0, 250);
  const createdObjects = [];

  for (const [index, feature] of features.entries()) {
    const geometryType = supportedGeometryType(feature.geometry);
    if (!geometryType) {
      skipped.push(`Feature ${index + 1}: geometry ${feature.geometry?.type ?? "unknown"} belum didukung`);
      continue;
    }

    const { latitude, longitude } = pointCoordinates(feature);
    const measurements = objectMeasurements(feature, geometryType);
    const object = await prisma.mapObject.create({
      data: {
        projectId,
        layerId: layer.id,
        categoryId: parsed.data.categoryId ?? undefined,
        riskLevelId: parsed.data.layerType === "disaster_risk" ? parsed.data.riskLevelId ?? undefined : undefined,
        createdBy: user.id,
        name: featureName(feature, `${parsed.data.namePrefix || "Import GeoJSON"} ${index + 1}`),
        label: featureName(feature, `GeoJSON ${index + 1}`),
        objectType: objectTypeFor(parsed.data.layerType, geometryType),
        geometryType,
        areaSize: measurements.areaSize ?? undefined,
        lengthSize: measurements.lengthSize ?? undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        description: "Objek diimpor dari file GeoJSON",
        notes: "Import GeoJSON",
        geometry: feature as object,
        metadata: {
          import_type: "geojson",
          imported_at: new Date().toISOString(),
          source_feature_index: index,
          source_properties: feature.properties ?? {},
        },
      },
    });
    await syncMapObjectPostgis(prisma, object.id, feature).catch(() => undefined);
    createdObjects.push(object);
  }

  await prisma.mappingProject.update({
    where: { id: projectId },
    data: { status: "active" },
  });

  await prisma.activityLog.create({
    data: {
      projectId,
      userId: user.id,
      action: "geojson.imported",
      targetType: "project",
      targetId: projectId,
      description: `${createdObjects.length} objek diimpor dari GeoJSON`,
      metadata: {
        layerType: parsed.data.layerType,
        importedCount: createdObjects.length,
        skippedCount: skipped.length,
        skipped,
      },
    },
  });

  return success({
    message: "GeoJSON berhasil diimpor",
    importedCount: createdObjects.length,
    skipped,
    objects: createdObjects.map(serializeObject),
  }, 201);
}
