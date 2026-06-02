import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

const updateProjectViewSchema = z.object({
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  defaultZoom: z.number().int().min(1).max(20),
  viewConfig: z.unknown().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const parsed = updateProjectViewSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Input view project tidak valid", 422);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true, status: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const updatedProject = await prisma.mappingProject.update({
    where: { id: projectId },
    data: {
      centerLat: parsed.data.centerLat,
      centerLng: parsed.data.centerLng,
      defaultZoom: parsed.data.defaultZoom,
      viewConfig: parsed.data.viewConfig === undefined ? undefined : (parsed.data.viewConfig as object),
      status: project.status === "draft" ? "active" : undefined,
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId,
      userId: user.id,
      action: "project.view_saved",
      targetType: "project",
      targetId: projectId,
      description: "Viewport dan konfigurasi layer project disimpan",
    },
  });

  return success({
    message: "View project berhasil disimpan",
    project: updatedProject,
  });
}
