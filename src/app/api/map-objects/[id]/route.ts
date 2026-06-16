import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

const updateMapObjectSchema = z.object({
  name: z.string().min(2),
  label: z.string().optional().nullable(),
  categoryId: z.number().int().optional().nullable(),
  riskLevelId: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const objectId = Number(id);
  if (!Number.isInteger(objectId)) return errorResponse("Objek tidak valid", 422);

  const parsed = updateMapObjectSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Input objek peta tidak valid", 422);

  const existingObject = await prisma.mapObject.findFirst({
    where: {
      id: objectId,
      project: { ownerId: user.id },
    },
    select: {
      id: true,
      projectId: true,
      layerId: true,
      name: true,
      label: true,
      categoryId: true,
      riskLevelId: true,
      description: true,
      notes: true,
    },
  });
  if (!existingObject) return errorResponse("Objek peta tidak ditemukan", 404);

  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, layerId: existingObject.layerId },
      select: { id: true },
    });
    if (!category) return errorResponse("Kategori tidak valid untuk layer objek ini", 422);
  }

  if (parsed.data.riskLevelId) {
    const risk = await prisma.riskLevel.findUnique({
      where: { id: parsed.data.riskLevelId },
      select: { id: true },
    });
    if (!risk) return errorResponse("Tingkat risiko tidak valid", 422);
  }

  const object = await prisma.mapObject.update({
    where: { id: objectId },
    data: {
      updatedBy: user.id,
      name: parsed.data.name,
      label: parsed.data.label || null,
      categoryId: parsed.data.categoryId ?? null,
      riskLevelId: parsed.data.riskLevelId ?? null,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: existingObject.projectId,
      userId: user.id,
      action: "map_object.updated",
      targetType: "map_object",
      targetId: object.id,
      description: "Objek peta diperbarui dari workspace",
      metadata: {
        before: {
          name: existingObject.name,
          label: existingObject.label,
          categoryId: existingObject.categoryId,
          riskLevelId: existingObject.riskLevelId,
          description: existingObject.description,
          notes: existingObject.notes,
        },
        after: {
          name: object.name,
          label: object.label,
          categoryId: object.categoryId,
          riskLevelId: object.riskLevelId,
          description: object.description,
          notes: object.notes,
        },
      },
    },
  });

  return success({ message: "Objek peta berhasil diperbarui", object: serializeObject(object) });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const objectId = Number(id);
  if (!Number.isInteger(objectId)) return errorResponse("Objek tidak valid", 422);

  const existingObject = await prisma.mapObject.findFirst({
    where: {
      id: objectId,
      project: { ownerId: user.id },
    },
    select: { id: true, projectId: true, name: true, objectType: true, geometryType: true },
  });
  if (!existingObject) return errorResponse("Objek peta tidak ditemukan", 404);

  await prisma.mapObject.delete({ where: { id: objectId } });

  await prisma.activityLog.create({
    data: {
      projectId: existingObject.projectId,
      userId: user.id,
      action: "map_object.deleted",
      targetType: "map_object",
      targetId: objectId,
      description: "Objek peta dihapus dari workspace",
      metadata: {
        deleted: {
          name: existingObject.name,
          objectType: existingObject.objectType,
          geometryType: existingObject.geometryType,
        },
      },
    },
  });

  return success({ message: "Objek peta berhasil dihapus" });
}
