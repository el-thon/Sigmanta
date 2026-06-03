import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensurePostgisSupport, NearbyMapObjectRow } from "@/lib/postgis";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

function numberParam(request: NextRequest, key: string) {
  const value = Number(request.nextUrl.searchParams.get(key));
  return Number.isFinite(value) ? value : null;
}

function serializeNearbyObject(row: NearbyMapObjectRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    layerId: row.layer_id,
    categoryId: row.category_id,
    riskLevelId: row.risk_level_id,
    name: row.name,
    label: row.label,
    objectType: row.object_type,
    geometryType: row.geometry_type,
    areaSize: row.area_size ? Number(row.area_size) : null,
    lengthSize: row.length_size ? Number(row.length_size) : null,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    description: row.description,
    notes: row.notes,
    geometry: row.geometry,
    metadata: row.metadata,
    styleConfig: row.style_config,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    distanceM: Math.round(Number(row.distance_m) * 100) / 100,
  };
}

function postgisErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("permission denied") || message.includes("must be owner")) {
    return "PostGIS belum bisa disiapkan otomatis karena user database tidak punya izin CREATE EXTENSION/ALTER TABLE.";
  }
  if (message.includes("extension \"postgis\" is not available")) {
    return "Extension PostGIS belum tersedia di database server ini.";
  }
  if (message.includes("function st_") || message.includes("type \"geometry\" does not exist")) {
    return "PostGIS belum aktif di database. Jalankan CREATE EXTENSION postgis dan pastikan kolom geometry_postgis tersedia.";
  }
  return `Query PostGIS gagal: ${message}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const latitude = numberParam(request, "lat");
  const longitude = numberParam(request, "lng");
  const radius = numberParam(request, "radius") ?? 1000;

  if (!Number.isInteger(projectId)) return errorResponse("Project tidak valid", 422);
  if (latitude === null || latitude < -90 || latitude > 90) return errorResponse("Latitude tidak valid", 422);
  if (longitude === null || longitude < -180 || longitude > 180) return errorResponse("Longitude tidak valid", 422);
  if (radius <= 0 || radius > 50000) return errorResponse("Radius harus 1 sampai 50000 meter", 422);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  try {
    await ensurePostgisSupport(prisma);

    await prisma.$executeRaw`
      UPDATE map_objects
      SET geometry_postgis = ST_SetSRID(ST_GeomFromGeoJSON((geometry -> 'geometry')::text), 4326)
      WHERE project_id = ${projectId}
        AND geometry_postgis IS NULL
        AND jsonb_typeof(geometry -> 'geometry') = 'object'
    `;

    const rows = await prisma.$queryRaw<NearbyMapObjectRow[]>`
      SELECT
        id,
        project_id,
        layer_id,
        category_id,
        risk_level_id,
        name,
        label,
        object_type::text AS object_type,
        geometry_type::text AS geometry_type,
        area_size,
        length_size,
        latitude,
        longitude,
        description,
        notes,
        geometry,
        metadata,
        style_config,
        created_at,
        updated_at,
        ST_Distance(
          geometry_postgis::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) AS distance_m
      FROM map_objects
      WHERE project_id = ${projectId}
        AND geometry_postgis IS NOT NULL
        AND ST_DWithin(
          geometry_postgis::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radius}
        )
      ORDER BY distance_m ASC, updated_at DESC
      LIMIT 50
    `;

    return success({
      center: { latitude, longitude },
      radius,
      objects: rows.map(serializeNearbyObject),
    });
  } catch (error) {
    return errorResponse(postgisErrorMessage(error), 500);
  }
}
