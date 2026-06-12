# SIGMANTA

SIGMANTA adalah platform WebGIS yang mengintegrasikan pemetaan lahan, identifikasi zona rawan bencana, dan pengelolaan titik mitigasi dalam satu peta interaktif. Sistem ini membantu pengguna memahami kondisi wilayah melalui segmentasi area, analisis risiko, serta visualisasi fasilitas mitigasi sehingga mendukung pengambilan keputusan berbasis informasi geospasial.

## Tech Stack

- Frontend + Backend: Next.js + TypeScript
- Peta 2D: Leaflet, React Leaflet, Leaflet Draw
- Hero 3D Earth: CSS globe, typewriter text, dan animasi UI
- ORM: Prisma
- Auth: custom JWT berbasis cookie HTTP-only
- Database: Supabase PostgreSQL atau PostgreSQL lokal
- Storage: Cloudflare R2
- Deployment: Vercel + Supabase

## Cara Menjalankan dengan Docker

```bash
cp .env.example .env
docker compose up -d
```

Setelah container aktif, jalankan migration dari service app:

```bash
docker compose exec app npx prisma migrate dev --name init
docker compose exec app npm run prisma:seed
```

Akses aplikasi di:

```bash
http://localhost:3000
```

## Konfigurasi Database dan Cloudflare R2

Gunakan Supabase atau PostgreSQL lokal melalui `DATABASE_URL`. File upload, seperti foto profil, disimpan di Cloudflare R2:

```bash
R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_BUCKET="sigmanta-uploads"
R2_ACCESS_KEY_ID="<ACCESS_KEY_ID>"
R2_SECRET_ACCESS_KEY="<SECRET_ACCESS_KEY>"
R2_PUBLIC_URL="/api/storage"
```

`R2_PUBLIC_URL="/api/storage"` membuat file dibaca melalui route aplikasi sehingga preview tetap stabil di local dan Vercel. Setelah custom domain R2 siap, nilai ini bisa diganti ke URL CDN, misalnya `https://cdn.domain.com`.

## Struktur Awal

- `src/app` untuk App Router Next.js
- `src/components` untuk komponen UI dan peta
- `src/lib` untuk helper auth, prisma, project, dan response
- `src/constants` untuk layer, kategori, dan risk level default
- `prisma/schema.prisma` untuk skema database
- `docker-compose.yml` untuk development stack

## Mode Share Project

SIGMANTA tidak menggunakan kolaborasi realtime. Share link digunakan untuk mengimpor atau menyalin project ke akun personal penerima. Project asli tetap aman dan tidak berubah.
