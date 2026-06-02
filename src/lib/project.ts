import { prisma } from "./prisma";
import { DEFAULT_CATEGORIES, DEFAULT_LAYERS } from "@/constants/defaultLayers";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createDefaultLayers(projectId: number) {
  for (const layer of DEFAULT_LAYERS) {
    const createdLayer = await prisma.projectLayer.create({
      data: {
        projectId,
        name: layer.name,
        layerType: layer.layerType,
        renderType: layer.renderType,
        displayOrder: layer.displayOrder,
      },
    });

    const categoryNames = DEFAULT_CATEGORIES[layer.layerType as keyof typeof DEFAULT_CATEGORIES] ?? [];
    await prisma.category.createMany({
      data: categoryNames.map((name, index) => ({
        layerId: createdLayer.id,
        name,
        code: slugify(name),
        color: defaultColor(index),
      })),
    });
  }
}

function defaultColor(index: number) {
  const colors = ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#64748b"];
  return colors[index % colors.length];
}
