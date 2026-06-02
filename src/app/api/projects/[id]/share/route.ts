import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

function appUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserRecord();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true, name: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const existing = await prisma.projectShareLink.findFirst({
    where: { projectId, createdBy: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const shareLink = existing ?? await prisma.projectShareLink.create({
    data: {
      projectId,
      createdBy: user.id,
      token: randomBytes(24).toString("hex"),
      isActive: true,
    },
  });

  return success({
    project: { id: project.id, name: project.name },
    token: shareLink.token,
    url: `${appUrl(request)}/share/${shareLink.token}`,
  });
}
