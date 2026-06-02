-- SIGMITA database schema for Supabase/PostgreSQL.
-- Run this in Supabase SQL Editor for a clean database, or use Prisma db push for
-- application-managed tables. PostGIS is enabled here for spatial indexing/querying.

CREATE SCHEMA IF NOT EXISTS "public";
CREATE EXTENSION IF NOT EXISTS postgis;

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'active', 'archived', 'imported');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LayerType" AS ENUM ('land_segmentation', 'disaster_risk', 'elevation', 'marker_label', 'evacuation_route', 'mitigation_resource');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RenderType" AS ENUM ('primary', 'overlay');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ObjectType" AS ENUM ('land_segment', 'disaster_area', 'elevation_area', 'marker', 'route', 'resource_point', 'radius_area');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GeometryType" AS ENUM ('point', 'linestring', 'polygon', 'rectangle', 'circle');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ObjectStatus" AS ENUM ('active', 'inactive', 'need_verification');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ExportType" AS ENUM ('png', 'pdf', 'geojson');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(100) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "phone" VARCHAR(30),
  "address" TEXT,
  "institution" VARCHAR(150),
  "occupation" VARCHAR(120),
  "age" INTEGER,
  "bio" TEXT,
  "avatar_url" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "mapping_projects" (
  "id" SERIAL PRIMARY KEY,
  "owner_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "source_project_id" INTEGER REFERENCES "mapping_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "name" VARCHAR(150) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "location_name" VARCHAR(150),
  "center_lat" DECIMAL(10,8),
  "center_lng" DECIMAL(11,8),
  "default_zoom" INTEGER NOT NULL DEFAULT 13,
  "status" "ProjectStatus" NOT NULL DEFAULT 'draft',
  "view_config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("owner_id", "slug")
);

CREATE TABLE IF NOT EXISTS "project_share_links" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "mapping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "project_imports" (
  "id" SERIAL PRIMARY KEY,
  "share_link_id" INTEGER NOT NULL REFERENCES "project_share_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "source_project_id" INTEGER NOT NULL REFERENCES "mapping_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "imported_project_id" INTEGER NOT NULL REFERENCES "mapping_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "imported_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "project_layers" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "mapping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" VARCHAR(120) NOT NULL,
  "layer_type" "LayerType" NOT NULL,
  "render_type" "RenderType" NOT NULL DEFAULT 'overlay',
  "is_visible" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "style_config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id" SERIAL PRIMARY KEY,
  "layer_id" INTEGER NOT NULL REFERENCES "project_layers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(80),
  "color" VARCHAR(20),
  "icon" VARCHAR(100),
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "risk_levels" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "color" VARCHAR(20) NOT NULL,
  "score" INTEGER NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "map_objects" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "mapping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "layer_id" INTEGER NOT NULL REFERENCES "project_layers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "category_id" INTEGER REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "risk_level_id" INTEGER REFERENCES "risk_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "updated_by" INTEGER REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "name" VARCHAR(150) NOT NULL,
  "label" VARCHAR(150),
  "object_type" "ObjectType" NOT NULL,
  "geometry_type" "GeometryType" NOT NULL,
  "area_size" DECIMAL(14,2),
  "area_unit" VARCHAR(10) NOT NULL DEFAULT 'm2',
  "length_size" DECIMAL(14,2),
  "length_unit" VARCHAR(10) NOT NULL DEFAULT 'm',
  "latitude" DECIMAL(10,8),
  "longitude" DECIMAL(11,8),
  "status" "ObjectStatus" NOT NULL DEFAULT 'active',
  "description" TEXT,
  "notes" TEXT,
  "geometry" JSONB NOT NULL,
  "geometry_postgis" geometry(Geometry, 4326),
  "metadata" JSONB,
  "label_config" JSONB,
  "style_config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "map_objects_geometry_postgis_idx" ON "map_objects" USING GIST ("geometry_postgis");
CREATE INDEX IF NOT EXISTS "map_objects_project_layer_idx" ON "map_objects" ("project_id", "layer_id");
CREATE INDEX IF NOT EXISTS "map_objects_category_idx" ON "map_objects" ("category_id");
CREATE INDEX IF NOT EXISTS "map_objects_risk_level_idx" ON "map_objects" ("risk_level_id");

CREATE TABLE IF NOT EXISTS "map_exports" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "mapping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "created_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" VARCHAR(150) NOT NULL,
  "export_type" "ExportType" NOT NULL,
  "file_path" VARCHAR(255),
  "export_config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "mapping_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "action" VARCHAR(100) NOT NULL,
  "target_type" VARCHAR(100),
  "target_id" INTEGER,
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Optional helper when inserting GeoJSON manually:
-- UPDATE map_objects
-- SET geometry_postgis = ST_SetSRID(ST_GeomFromGeoJSON(geometry -> 'geometry'), 4326)
-- WHERE geometry_postgis IS NULL;
