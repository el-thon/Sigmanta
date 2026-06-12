import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/response";

const ZIP_EPOCH = new Date("1980-01-01T00:00:00.000Z");

function toNumber(value: { toString(): string } | number | null) {
  return value === null ? null : Number(value);
}

function getFeatureProperties(geometry: unknown) {
  if (!geometry || typeof geometry !== "object" || !("properties" in geometry)) return {};
  const properties = (geometry as { properties?: unknown }).properties;
  return properties && typeof properties === "object" && !Array.isArray(properties) ? properties : {};
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "layer";
}

function getGeometryType(feature: unknown) {
  if (!feature || typeof feature !== "object" || !("geometry" in feature)) return "unknown";
  const geometry = (feature as { geometry?: { type?: unknown } }).geometry;
  return typeof geometry?.type === "string" ? geometry.type.toLowerCase() : "unknown";
}

function getRadiusMeters(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("radius_m" in metadata)) return null;
  const radius = Number((metadata as { radius_m?: unknown }).radius_m);
  return Number.isFinite(radius) && radius > 0 ? radius : null;
}

function circlePointToPolygon(feature: unknown, radiusMeters: number, steps = 96) {
  if (!feature || typeof feature !== "object" || !("geometry" in feature)) return feature;
  const typedFeature = feature as { geometry?: { type?: unknown; coordinates?: unknown } };
  if (typedFeature.geometry?.type !== "Point" || !Array.isArray(typedFeature.geometry.coordinates)) return feature;

  const [longitude, latitude] = typedFeature.geometry.coordinates.map(Number);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return feature;

  const earthRadiusMeters = 6378137;
  const latRad = (latitude * Math.PI) / 180;
  const coordinates = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (index % steps / steps) * Math.PI * 2;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const nextLatitude = latitude + (dy / earthRadiusMeters) * (180 / Math.PI);
    const nextLongitude = longitude + (dx / (earthRadiusMeters * Math.cos(latRad))) * (180 / Math.PI);
    return [nextLongitude, nextLatitude];
  });

  return {
    ...(feature as object),
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const safeDate = date < ZIP_EPOCH ? ZIP_EPOCH : date;
  const year = safeDate.getUTCFullYear();
  const dosTime = (safeDate.getUTCHours() << 11) | (safeDate.getUTCMinutes() << 5) | Math.floor(safeDate.getUTCSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((safeDate.getUTCMonth() + 1) << 5) | safeDate.getUTCDate();
  return { dosDate, dosTime };
}

function writeUint16(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

function createZip(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder();
  const encodedFiles = files.map((file) => ({
    filename: file.name,
    filenameBytes: encoder.encode(file.name),
    data: encoder.encode(file.content),
    modifiedAt: new Date(),
  }));
  const centralDirectory: Uint8Array[] = [];
  const localFiles: Uint8Array[] = [];
  let offset = 0;

  encodedFiles.forEach((file) => {
    const checksum = crc32(file.data);
    const { dosDate, dosTime } = dosDateTime(file.modifiedAt);
    const local = new Uint8Array(30 + file.filenameBytes.length + file.data.length);
    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20);
    writeUint16(local, 6, 0x0800);
    writeUint16(local, 8, 0);
    writeUint16(local, 10, dosTime);
    writeUint16(local, 12, dosDate);
    writeUint32(local, 14, checksum);
    writeUint32(local, 18, file.data.length);
    writeUint32(local, 22, file.data.length);
    writeUint16(local, 26, file.filenameBytes.length);
    local.set(file.filenameBytes, 30);
    local.set(file.data, 30 + file.filenameBytes.length);
    localFiles.push(local);

    const central = new Uint8Array(46 + file.filenameBytes.length);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 20);
    writeUint16(central, 6, 20);
    writeUint16(central, 8, 0x0800);
    writeUint16(central, 10, 0);
    writeUint16(central, 12, dosTime);
    writeUint16(central, 14, dosDate);
    writeUint32(central, 16, checksum);
    writeUint32(central, 20, file.data.length);
    writeUint32(central, 24, file.data.length);
    writeUint16(central, 28, file.filenameBytes.length);
    writeUint32(central, 42, offset);
    central.set(file.filenameBytes, 46);
    centralDirectory.push(central);

    offset += local.length;
  });

  const centralDirectorySize = centralDirectory.reduce((sum, file) => sum + file.length, 0);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, encodedFiles.length);
  writeUint16(end, 10, encodedFiles.length);
  writeUint32(end, 12, centralDirectorySize);
  writeUint32(end, 16, offset);

  const zip = new Uint8Array(offset + centralDirectorySize + end.length);
  let cursor = 0;
  [...localFiles, ...centralDirectory, end].forEach((part) => {
    zip.set(part, cursor);
    cursor += part.length;
  });
  return zip;
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    include: {
      layers: {
        include: {
          categories: {
            select: { id: true, name: true, code: true, color: true, icon: true, description: true, metadata: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
      objects: {
        include: {
          layer: { select: { id: true, name: true, layerType: true, renderType: true, displayOrder: true, isVisible: true, styleConfig: true } },
          category: { select: { id: true, name: true, code: true, color: true, icon: true, description: true, metadata: true } },
          riskLevel: { select: { id: true, name: true, code: true, color: true, score: true, description: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const collectionProperties = {
    projectId: project.id,
    projectName: project.name,
    locationName: project.locationName,
    exportedAt: new Date().toISOString(),
    layers: project.layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      layerType: layer.layerType,
      renderType: layer.renderType,
      isVisible: layer.isVisible,
      displayOrder: layer.displayOrder,
      styleConfig: layer.styleConfig,
      categories: layer.categories,
    })),
  };

  const features = project.objects.map((object) => {
    const radiusMeters = object.geometryType === "circle" ? getRadiusMeters(object.metadata) : null;
    const geometry = radiusMeters ? circlePointToPolygon(object.geometry, radiusMeters) : object.geometry;
    const sourceProperties = getFeatureProperties(geometry);

    return {
      ...(geometry as object),
      properties: {
        ...sourceProperties,
        id: object.id,
        projectId: object.projectId,
        name: object.name,
        label: object.label,
        objectType: object.objectType,
        geometryType: object.geometryType,
        exportedGeometryType: getGeometryType(geometry),
        layerId: object.layerId,
        layerName: object.layer.name,
        layerType: object.layer.layerType,
        layerRenderType: object.layer.renderType,
        layerDisplayOrder: object.layer.displayOrder,
        categoryId: object.categoryId,
        categoryName: object.category?.name ?? null,
        categoryCode: object.category?.code ?? null,
        categoryColor: object.category?.color ?? null,
        riskLevelId: object.riskLevelId,
        riskLevelName: object.riskLevel?.name ?? null,
        riskLevelCode: object.riskLevel?.code ?? null,
        riskLevelColor: object.riskLevel?.color ?? null,
        riskLevelScore: object.riskLevel?.score ?? null,
        areaSize: toNumber(object.areaSize),
        areaUnit: object.areaUnit,
        lengthSize: toNumber(object.lengthSize),
        lengthUnit: object.lengthUnit,
        latitude: toNumber(object.latitude),
        longitude: toNumber(object.longitude),
        radiusMeters,
        status: object.status,
        description: object.description,
        notes: object.notes,
        metadata: object.metadata,
        styleConfig: object.styleConfig,
        layer: object.layer,
        category: object.category,
        riskLevel: object.riskLevel,
        createdAt: object.createdAt.toISOString(),
        updatedAt: object.updatedAt.toISOString(),
      },
    };
  });

  const featureCollection = {
    type: "FeatureCollection",
    name: project.name,
    properties: collectionProperties,
    features,
  };

  const groupedFeatures = features.reduce<Record<string, typeof features>>((groups, feature) => {
    const properties = feature.properties as { layerName: string; layerType: string };
    const key = `${safeFilename(properties.layerName)}-${getGeometryType(feature)}`;
    groups[key] = groups[key] ?? [];
    groups[key].push(feature);
    return groups;
  }, {});

  const zipFiles = [
    {
      name: `${safeFilename(project.name)}-semua-layer.geojson`,
      content: JSON.stringify(featureCollection, null, 2),
    },
    ...Object.entries(groupedFeatures).map(([key, grouped]) => ({
      name: `${key}.geojson`,
      content: JSON.stringify({
        type: "FeatureCollection",
        name: key,
        properties: collectionProperties,
        features: grouped,
      }, null, 2),
    })),
  ];

  const objectCountByLayer = project.objects.reduce<Record<string, number>>((counts, object) => {
    counts[object.layer.layerType] = (counts[object.layer.layerType] ?? 0) + 1;
    return counts;
  }, {});

  await prisma.mapExport.create({
    data: {
      projectId,
      createdBy: user.id,
      title: `${project.name} GeoJSON`,
      exportType: "geojson",
      exportConfig: { objectCount: project.objects.length, objectCountByLayer },
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId,
      userId: user.id,
      action: "project.exported",
      targetType: "project",
      targetId: projectId,
      description: "Project diexport sebagai GeoJSON",
    },
  });

  const zip = createZip(zipFiles);

  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="sigmanta-project-${project.id}-arcgis-geojson.zip"`,
    },
  });
}
