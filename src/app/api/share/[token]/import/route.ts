import { NextRequest } from "next/server";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";
import { slugify } from "@/lib/project";

export async function POST(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const user = await getCurrentUserRecord();
  if (!user) return errorResponse("Belum login", 401);

  const { token } = await params;
  const shareLink = await prisma.projectShareLink.findUnique({
    where: { token },
    include: {
      project: {
        include: {
          layers: {
            include: {
              categories: true,
              objects: true,
            },
            orderBy: { displayOrder: "asc" },
          },
          objects: true,
        },
      },
    },
  });

  if (!shareLink || !shareLink.isActive) return errorResponse("Link share tidak aktif", 404);
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) return errorResponse("Link share sudah kedaluwarsa", 410);

  const sourceProject = shareLink.project;
  const importedProject = await prisma.$transaction(async (tx) => {
    const project = await tx.mappingProject.create({
      data: {
        ownerId: user.id,
        sourceProjectId: sourceProject.id,
        name: `${sourceProject.name} (Copy)`,
        slug: `${slugify(sourceProject.name)}-copy-${Date.now()}`,
        description: sourceProject.description,
        locationName: sourceProject.locationName,
        centerLat: sourceProject.centerLat,
        centerLng: sourceProject.centerLng,
        defaultZoom: sourceProject.defaultZoom,
        status: "imported",
        viewConfig: sourceProject.viewConfig ?? undefined,
      },
    });

    const layerIdMap = new Map<number, number>();
    const categoryIdMap = new Map<number, number>();

    for (const layer of sourceProject.layers) {
      const createdLayer = await tx.projectLayer.create({
        data: {
          projectId: project.id,
          name: layer.name,
          layerType: layer.layerType,
          renderType: layer.renderType,
          isVisible: layer.isVisible,
          displayOrder: layer.displayOrder,
          styleConfig: layer.styleConfig ?? undefined,
        },
      });
      layerIdMap.set(layer.id, createdLayer.id);

      for (const category of layer.categories) {
        const createdCategory = await tx.category.create({
          data: {
            layerId: createdLayer.id,
            name: category.name,
            code: category.code,
            color: category.color,
            icon: category.icon,
            description: category.description,
            metadata: category.metadata ?? undefined,
          },
        });
        categoryIdMap.set(category.id, createdCategory.id);
      }
    }

    for (const object of sourceProject.objects) {
      const layerId = layerIdMap.get(object.layerId);
      if (!layerId) continue;

      await tx.mapObject.create({
        data: {
          projectId: project.id,
          layerId,
          categoryId: object.categoryId ? categoryIdMap.get(object.categoryId) : undefined,
          riskLevelId: object.riskLevelId,
          createdBy: user.id,
          name: object.name,
          label: object.label,
          objectType: object.objectType,
          geometryType: object.geometryType,
          areaSize: object.areaSize,
          areaUnit: object.areaUnit,
          lengthSize: object.lengthSize,
          lengthUnit: object.lengthUnit,
          latitude: object.latitude,
          longitude: object.longitude,
          status: object.status,
          description: object.description,
          notes: object.notes,
          geometry: object.geometry as object,
          metadata: object.metadata === null ? undefined : (object.metadata as object),
          labelConfig: object.labelConfig === null ? undefined : (object.labelConfig as object),
          styleConfig: object.styleConfig === null ? undefined : (object.styleConfig as object),
        },
      });
    }

    await tx.projectImport.create({
      data: {
        shareLinkId: shareLink.id,
        sourceProjectId: sourceProject.id,
        importedProjectId: project.id,
        importedBy: user.id,
      },
    });

    await tx.activityLog.create({
      data: {
        projectId: project.id,
        userId: user.id,
        action: "project.imported",
        targetType: "project",
        targetId: sourceProject.id,
        description: "Project disalin dari share link",
      },
    });

    return project;
  });

  return success({
    message: "Project berhasil disalin ke workspace kamu",
    project: importedProject,
  }, 201);
}
