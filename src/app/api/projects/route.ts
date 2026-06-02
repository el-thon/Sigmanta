import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createDefaultLayers, slugify } from "@/lib/project";
import { errorResponse, success } from "@/lib/response";

const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  locationName: z.string().optional(),
  centerLat: z.number().optional(),
  centerLng: z.number().optional(),
  defaultZoom: z.number().int().min(1).max(20).default(13),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const projects = await prisma.mappingProject.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return success({ projects });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Input project tidak valid", 422);

  const slug = `${slugify(parsed.data.name)}-${Date.now()}`;

  const project = await prisma.mappingProject.create({
    data: {
      ownerId: user.id,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      locationName: parsed.data.locationName,
      centerLat: parsed.data.centerLat,
      centerLng: parsed.data.centerLng,
      defaultZoom: parsed.data.defaultZoom,
      status: "draft",
    },
  });

  await createDefaultLayers(project.id);
  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: user.id,
      action: "project.created",
      description: "Project pemetaan dibuat",
    },
  });

  return success({ message: "Project berhasil dibuat", project }, 201);
}
