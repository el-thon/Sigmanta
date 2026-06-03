# SIGMANTA

SIGMANTA adalah platform WebGIS yang mengintegrasikan pemetaan lahan, identifikasi zona rawan bencana, dan pengelolaan titik mitigasi dalam satu peta interaktif. Sistem ini membantu pengguna memahami kondisi wilayah melalui segmentasi area, analisis risiko, serta visualisasi fasilitas mitigasi sehingga mendukung pengambilan keputusan berbasis informasi geospasial.

## Tech Stack

- Frontend + Backend: Next.js + TypeScript
- Peta 2D: Leaflet, React Leaflet, Leaflet Draw
- Hero 3D Earth: CSS globe, typewriter text, dan animasi UI
- ORM: Prisma
- Auth: custom JWT berbasis cookie HTTP-only
- Database: Supabase PostgreSQL atau PostgreSQL lokal
- Storage: local filesystem (`public/uploads`)
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

## Konfigurasi Supabase Database dan Local Storage

Gunakan Supabase hanya untuk database PostgreSQL melalui `DATABASE_URL`. Storage disimpan lokal di filesystem project/server:

```bash
LOCAL_STORAGE_DIR="public/uploads"
NEXT_PUBLIC_LOCAL_STORAGE_URL="/uploads"
```

Catatan deployment: local storage cocok untuk development atau server dengan disk persisten. Jika deploy ke platform serverless, file upload lokal dapat hilang saat instance diganti.

## Struktur Awal

- `src/app` untuk App Router Next.js
- `src/components` untuk komponen UI dan peta
- `src/lib` untuk helper auth, prisma, project, dan response
- `src/constants` untuk layer, kategori, dan risk level default
- `prisma/schema.prisma` untuk skema database
- `docker-compose.yml` untuk development stack

## Mode Share Project

SIGMANTA tidak menggunakan kolaborasi realtime. Share link digunakan untuk mengimpor atau menyalin project ke akun personal penerima. Project asli tetap aman dan tidak berubah.
