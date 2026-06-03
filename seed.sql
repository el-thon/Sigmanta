-- SIGMANTA seed data for Supabase SQL Editor.
-- Demo admin:
-- email: admin@sigmanta.test
-- password: password123

INSERT INTO "risk_levels" ("name", "code", "color", "score", "description", "updated_at")
VALUES
  ('Aman', 'safe', '#22c55e', 1, 'Area aman atau risiko sangat rendah.', CURRENT_TIMESTAMP),
  ('Rendah', 'low', '#84cc16', 2, 'Area dengan risiko rendah.', CURRENT_TIMESTAMP),
  ('Sedang', 'medium', '#eab308', 3, 'Area dengan risiko sedang.', CURRENT_TIMESTAMP),
  ('Tinggi', 'high', '#f97316', 4, 'Area dengan risiko tinggi.', CURRENT_TIMESTAMP),
  ('Ekstrem', 'extreme', '#dc2626', 5, 'Area dengan risiko ekstrem.', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "score" = EXCLUDED."score",
  "description" = EXCLUDED."description",
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "users" (
  "name",
  "email",
  "password",
  "role",
  "phone",
  "address",
  "institution",
  "occupation",
  "age",
  "updated_at"
)
VALUES (
  'Admin SIGMANTA',
  'admin@sigmanta.test',
  '$2b$10$bYXlFN5dNZx5Zl9lJPDUf.An/Ai8Bh3upkGX2cw.WZ778g/.Zs3we',
  'admin',
  '+620000000000',
  'SIGMANTA Admin Workspace',
  'SIGMANTA',
  'System Administrator',
  30,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "password" = EXCLUDED."password",
  "role" = EXCLUDED."role",
  "phone" = EXCLUDED."phone",
  "address" = EXCLUDED."address",
  "institution" = EXCLUDED."institution",
  "occupation" = EXCLUDED."occupation",
  "age" = EXCLUDED."age",
  "updated_at" = CURRENT_TIMESTAMP;
