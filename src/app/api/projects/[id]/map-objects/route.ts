import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { syncMapObjectPostgis } from "@/lib/postgis";
import { errorResponse, success } from "@/lib/response";

const mapObjectSchema = z.object({
  name: z.string().min(2),
  label: z.string().optional(),
  layerId: z.number().int(),
  categoryId: z.number().int().optional().nullable(),
  riskLevelId: z.number().int().optional().nullable(),
  objectType: z.enum(["land_segment", "disaster_area", "elevation_area", "marker", "route", "resource_point", "radius_area"]),
  geometryType: z.enum(["point", "linestring", "polygon", "rectangle", "circle"]),
  areaSize: z.number().optional().nullable(),
  lengthSize: z.number().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  description: z.string().optional(),
  notes: z.string().optional(),
  geometry: z.unknown(),
  metadata: z.unknown().optional().nullable(),
  styleConfig: z.unknown().optional().nullable(),
});

function serializeObject(object: Awaited<ReturnType<typeof prisma.mapObject.findFirstOrThrow>>) {
  return {
    ...object,
    areaSize: object.areaSize ? Number(object.areaSize) : null,
    lengthSize: object.lengthSize ? Number(object.lengthSize) : null,
    latitude: object.latitude ? Number(object.latitude) : null,
    longitude: object.longitude ? Number(object.longitude) : null,
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const objects = await prisma.mapObject.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });

  return success({ objects: objects.map(serializeObject) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const parsed = mapObjectSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Input objek peta tidak valid", 422);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const layer = await prisma.projectLayer.findFirst({
    where: { id: parsed.data.layerId, projectId },
    select: { id: true },
  });
  if (!layer) return errorResponse("Layer project tidak valid", 422);

  const object = await prisma.mapObject.create({
    data: {
      projectId,
      layerId: parsed.data.layerId,
      categoryId: parsed.data.categoryId ?? undefined,
      riskLevelId: parsed.data.riskLevelId ?? undefined,
      createdBy: user.id,
      name: parsed.data.name,
      label: parsed.data.label,
      objectType: parsed.data.objectType,
      geometryType: parsed.data.geometryType,
      areaSize: parsed.data.areaSize ?? undefined,
      lengthSize: parsed.data.lengthSize ?? undefined,
      latitude: parsed.data.latitude ?? undefined,
      longitude: parsed.data.longitude ?? undefined,
      description: parsed.data.description,
      notes: parsed.data.notes,
      geometry: parsed.data.geometry as object,
      metadata: parsed.data.metadata === undefined ? undefined : (parsed.data.metadata as object),
      styleConfig: parsed.data.styleConfig === undefined ? undefined : (parsed.data.styleConfig as object),
    },
  });

  await syncMapObjectPostgis(prisma, object.id, parsed.data.geometry).catch(() => undefined);

  await prisma.mappingProject.update({
    where: { id: projectId },
    data: { status: "active" },
  });

  await prisma.activityLog.create({
    data: {
      projectId,
      userId: user.id,
      action: "map_object.created",
      targetType: "map_object",
      targetId: object.id,
      description: "Objek peta dibuat dari workspace",
    },
  });

  return success({ message: "Objek peta berhasil disimpan", object: serializeObject(object) }, 201);
}
