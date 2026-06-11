import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/response";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    include: {
      objects: {
        include: {
          layer: { select: { name: true, layerType: true } },
          category: { select: { name: true, color: true } },
          riskLevel: { select: { name: true, code: true, color: true, score: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const featureCollection = {
    type: "FeatureCollection",
    name: project.name,
    properties: {
      projectId: project.id,
      projectName: project.name,
      locationName: project.locationName,
      exportedAt: new Date().toISOString(),
    },
    features: project.objects.map((object) => ({
      ...(object.geometry as object),
      properties: {
        id: object.id,
        name: object.name,
        label: object.label,
        objectType: object.objectType,
        geometryType: object.geometryType,
        layer: object.layer,
        category: object.category,
        riskLevel: object.riskLevel,
        areaSize: object.areaSize ? Number(object.areaSize) : null,
        areaUnit: object.areaUnit,
        lengthSize: object.lengthSize ? Number(object.lengthSize) : null,
        lengthUnit: object.lengthUnit,
        latitude: object.latitude ? Number(object.latitude) : null,
        longitude: object.longitude ? Number(object.longitude) : null,
        description: object.description,
        notes: object.notes,
        createdAt: object.createdAt.toISOString(),
        updatedAt: object.updatedAt.toISOString(),
      },
    })),
  };

  await prisma.mapExport.create({
    data: {
      projectId,
      createdBy: user.id,
      title: `${project.name} GeoJSON`,
      exportType: "geojson",
      exportConfig: { objectCount: project.objects.length },
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

  return Response.json(featureCollection, {
    headers: {
      "Content-Disposition": `attachment; filename="sigmanta-project-${project.id}.geojson"`,
    },
  });
}
