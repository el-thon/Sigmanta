import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

const updateProjectViewSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  locationName: z.string().optional().nullable(),
  centerLat: z.number().min(-90).max(90).optional().nullable(),
  centerLng: z.number().min(-180).max(180).optional().nullable(),
  defaultZoom: z.number().int().min(1).max(20).optional(),
  status: z.enum(["draft", "active", "archived", "imported"]).optional(),
  viewConfig: z.unknown().optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    include: {
      _count: { select: { layers: true, objects: true, shareLinks: true } },
      layers: { include: { categories: true }, orderBy: { displayOrder: "asc" } },
    },
  });

  if (!project) return errorResponse("Project tidak ditemukan", 404);
  return success({ project });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const parsed = updateProjectViewSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Input project tidak valid", 422);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true, status: true, slug: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const updatedProject = await prisma.mappingProject.update({
    where: { id: projectId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      locationName: parsed.data.locationName,
      centerLat: parsed.data.centerLat,
      centerLng: parsed.data.centerLng,
      defaultZoom: parsed.data.defaultZoom,
      viewConfig: parsed.data.viewConfig === undefined ? undefined : (parsed.data.viewConfig as object),
      status: parsed.data.status ?? (project.status === "draft" && parsed.data.viewConfig ? "active" : undefined),
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId,
      userId: user.id,
      action: parsed.data.viewConfig ? "project.view_saved" : "project.updated",
      targetType: "project",
      targetId: projectId,
      description: parsed.data.viewConfig ? "Viewport dan konfigurasi layer project disimpan" : "Project pemetaan diperbarui",
    },
  });

  return success({
    message: parsed.data.viewConfig ? "View project berhasil disimpan" : "Project berhasil diperbarui",
    project: updatedProject,
  });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  await prisma.mappingProject.delete({ where: { id: projectId } });
  return success({ message: "Project berhasil dihapus" });
}
