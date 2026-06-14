import { Prisma } from "@prisma/client";
import type { Feature } from "geojson";

type RawExecutor = {
  $executeRaw: typeof import("@/lib/prisma").prisma.$executeRaw;
};

export async function ensurePostgisSupport(db: RawExecutor) {
  await db.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis`;
  await db.$executeRaw`
    ALTER TABLE map_objects
    ADD COLUMN IF NOT EXISTS geometry_postgis geometry(Geometry, 4326)
  `;
  await db.$executeRaw`
    CREATE INDEX IF NOT EXISTS map_objects_geometry_postgis_idx
    ON map_objects USING GIST (geometry_postgis)
  `;
}

export async function syncMapObjectPostgis(db: RawExecutor, objectId: number, geometry: unknown) {
  const feature = geometry as Partial<Feature> | null;
  if (!feature?.geometry) return;

  await ensurePostgisSupport(db);
  await db.$executeRaw`
    UPDATE map_objects
    SET geometry_postgis = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 4326)
    WHERE id = ${objectId}
  `;
}

export type NearbyMapObjectRow = {
  id: number;
  project_id: number;
  layer_id: number;
  layer_type: string | null;
  category_id: number | null;
  risk_level_id: number | null;
  name: string;
  label: string | null;
  object_type: string;
  geometry_type: string;
  area_size: Prisma.Decimal | null;
  length_size: Prisma.Decimal | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  description: string | null;
  notes: string | null;
  geometry: unknown;
  metadata: unknown;
  style_config: unknown;
  created_at: Date;
  updated_at: Date;
  distance_m: number;
};
