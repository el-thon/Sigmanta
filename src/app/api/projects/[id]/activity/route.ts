import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return errorResponse("Project tidak valid", 422);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 30, 1), 100);
  const activities = await prisma.activityLog.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return success({
    activities: activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      targetType: activity.targetType,
      targetId: activity.targetId,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user,
    })),
  });
}
