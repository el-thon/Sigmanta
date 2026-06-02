# SIGMITA

SIGMITA adalah platform WebGIS yang mengintegrasikan pemetaan lahan, identifikasi zona rawan bencana, dan pengelolaan titik mitigasi dalam satu peta interaktif. Sistem ini membantu pengguna memahami kondisi wilayah melalui segmentasi area, analisis risiko, serta visualisasi fasilitas mitigasi sehingga mendukung pengambilan keputusan berbasis informasi geospasial.

## Tech Stack

- Frontend + Backend: Next.js + TypeScript
- Peta 2D: Leaflet, React Leaflet, Leaflet Draw
- Hero 3D Earth: video 3D Earth overlay text dan animasi UI
- Database: PostgreSQL + PostGIS
- ORM: Prisma
- Auth: custom JWT berbasis cookie HTTP-only
- Storage: Supabase Storage / S3-compatible storage
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

## Catatan Video Hero

Landing page menggunakan video sebagai elemen 3D Earth. Letakkan file video di:

```bash
public/videos/earth-hero.mp4
```

Atau ubah URL video melalui env:

```bash
NEXT_PUBLIC_EARTH_VIDEO_URL="/videos/earth-hero.mp4"
```

## Struktur Awal

- `src/app` untuk App Router Next.js
- `src/components` untuk komponen UI dan peta
- `src/lib` untuk helper auth, prisma, project, dan response
- `src/constants` untuk layer, kategori, dan risk level default
- `prisma/schema.prisma` untuk skema database
- `docker-compose.yml` untuk development stack

## Mode Share Project

SIGMITA tidak menggunakan kolaborasi realtime. Share link digunakan untuk mengimpor atau menyalin project ke akun personal penerima. Project asli tetap aman dan tidak berubah.
