import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMapObjectPostgis } from "@/lib/postgis";
import { errorResponse, success } from "@/lib/response";

const technicalDetailSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const publicFeatureSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["earthquakes", "natural_events", "wildfires", "air_quality"]),
  label: z.string().min(1),
  summary: z.string().optional(),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  value: z.string().nullable().optional(),
  observedAt: z.string().nullable().optional(),
  source: z.string().min(1),
  source_url: z.string().min(1),
  source_license: z.string().min(1),
  imported_at: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  unit: z.string().optional(),
  interpreted_value: z.string().optional(),
  status_label: z.string().optional(),
  status_description: z.string().optional(),
  interpretation_standard: z.string().optional(),
  technical_details: z.array(technicalDetailSchema).optional(),
});

const importSchema = z.object({
  feature: publicFeatureSchema,
});

function targetLayerType(category: z.infer<typeof publicFeatureSchema>["category"]) {
  if (category === "air_quality") return "marker_label";
  return "disaster_risk";
}

function categoryCandidates(feature: z.infer<typeof publicFeatureSchema>) {
  if (feature.category === "earthquakes") return ["Gempa Bumi"];
  if (feature.category === "wildfires") return ["Kebakaran Hutan/Lahan"];
  if (feature.category === "air_quality") return [];

  const haystack = `${feature.label} ${feature.summary ?? ""} ${feature.value ?? ""}`.toLowerCase();
  if (haystack.includes("flood")) return ["Banjir"];
  if (haystack.includes("landslide")) return ["Longsor"];
  if (haystack.includes("volcano")) return ["Erupsi Gunung Api"];
  if (haystack.includes("drought")) return ["Kekeringan"];
  if (haystack.includes("storm") || haystack.includes("wind")) return ["Angin Puting Beliung"];
  if (haystack.includes("wildfire") || haystack.includes("fire")) return ["Kebakaran Hutan/Lahan"];
  return [];
}

function objectTypeForCategory(category: z.infer<typeof publicFeatureSchema>["category"]) {
  return category === "air_quality" ? "marker" : "disaster_area";
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Belum login", 401);

  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Input fitur publik tidak valid", 422);

  const project = await prisma.mappingProject.findFirst({
    where: { id: projectId, ownerId: user.id },
    select: { id: true },
  });
  if (!project) return errorResponse("Project tidak ditemukan", 404);

  const feature = parsed.data.feature;
  const layer = await prisma.projectLayer.findFirst({
    where: { projectId, layerType: targetLayerType(feature.category) },
    include: { categories: true },
  });
  if (!layer) return errorResponse("Layer tujuan import tidak tersedia pada project ini", 422);

  const category = layer.categories.find((item) => categoryCandidates(feature).includes(item.name));
  const geometry = {
    type: "Feature",
    properties: {
      name: feature.label,
      source: feature.source,
      source_url: feature.source_url,
      public_dataset_id: feature.id,
      public_dataset_category: feature.category,
    },
    geometry: {
      type: "Point",
      coordinates: [feature.longitude, feature.latitude],
    },
  };
  const metadata = {
    import_type: "public_dataset_feature",
    public_dataset_id: feature.id,
    public_dataset_category: feature.category,
    source: feature.source,
    source_url: feature.source_url,
    source_license: feature.source_license,
    source_imported_at: feature.imported_at,
    imported_at: new Date().toISOString(),
    confidence: feature.confidence,
    observed_at: feature.observedAt ?? null,
    value: feature.value ?? null,
    unit: feature.unit ?? null,
    interpreted_value: feature.interpreted_value ?? null,
    status_label: feature.status_label ?? null,
    status_description: feature.status_description ?? null,
    interpretation_standard: feature.interpretation_standard ?? null,
    technical_details: feature.technical_details ?? [],
  };

  const object = await prisma.mapObject.create({
    data: {
      projectId,
      layerId: layer.id,
      categoryId: category?.id,
      createdBy: user.id,
      name: feature.label.slice(0, 150),
      label: (feature.value ?? feature.status_label ?? feature.category).slice(0, 150),
      objectType: objectTypeForCategory(feature.category),
      geometryType: "point",
      latitude: feature.latitude,
      longitude: feature.longitude,
      description: feature.summary ?? feature.label,
      notes: `Diimpor dari ${feature.source}. Lisensi: ${feature.source_license}.`,
      geometry,
      metadata,
      styleConfig: {
        importedFromPublicDataset: true,
        publicDatasetCategory: feature.category,
      },
    },
  });

  await syncMapObjectPostgis(prisma, object.id, geometry).catch(() => undefined);

  await prisma.mappingProject.update({
    where: { id: projectId },
    data: { status: "active" },
  });

  await prisma.activityLog.create({
    data: {
      projectId,
      userId: user.id,
      action: "public_dataset.imported",
      targetType: "map_object",
      targetId: object.id,
      description: `Fitur publik "${feature.label}" diimpor ke project`,
      metadata,
    },
  });

  return success({
    message: "Fitur publik berhasil diimpor ke project",
    object: {
      ...object,
      areaSize: object.areaSize ? Number(object.areaSize) : null,
      lengthSize: object.lengthSize ? Number(object.lengthSize) : null,
      latitude: object.latitude ? Number(object.latitude) : null,
      longitude: object.longitude ? Number(object.longitude) : null,
    },
    workspaceUrl: `/projects/${projectId}/map`,
  }, 201);
}
