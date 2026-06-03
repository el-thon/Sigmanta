# DESIGN.md — SIGMANTA

## 0. Identitas Sistem

**Nama sistem:** SIGMANTA  
**Kepanjangan konsep:** Sistem Informasi Geografis Mitigasi dan Tata Area  
**Jenis sistem:** Platform WebGIS berbasis project  
**Fokus utama:** Pemetaan lahan, zona rawan bencana, dan titik mitigasi dalam satu peta interaktif.

## 1. Deskripsi Project

SIGMANTA adalah platform WebGIS yang mengintegrasikan pemetaan lahan, identifikasi zona rawan bencana, dan pengelolaan titik mitigasi dalam satu peta interaktif. Sistem ini membantu pengguna memahami kondisi wilayah melalui segmentasi area, analisis risiko, serta visualisasi fasilitas mitigasi sehingga mendukung pengambilan keputusan yang lebih cepat dan tepat berbasis informasi geospasial.

## 2. Tujuan Sistem

1. Menyediakan platform pemetaan lahan berbasis peta interaktif.
2. Menyediakan fitur identifikasi dan visualisasi kawasan rawan bencana alam.
3. Menyediakan fitur pengelolaan titik mitigasi seperti posko, titik kumpul, alat berat, fasilitas kesehatan, dan sumber daya pendukung.
4. Mendukung digitasi objek spasial berupa polygon, rectangle, circle, marker, dan polyline.
5. Menyimpan geometri objek dalam format JSON/GeoJSON.
6. Menyimpan atribut fleksibel dalam metadata JSON.
7. Menyediakan output peta interaktif, data GeoJSON, rekap luas area, dan laporan ringkas project.
8. Mendukung mekanisme berbagi project melalui link yang akan mengimpor atau menyalin project ke akun personal penerima.

## 3. Konsep Utama Sistem

SIGMANTA menggunakan pendekatan **multi-project**. Setiap user dapat membuat project pemetaan sendiri. Di dalam project, user dapat membuat segmentasi lahan, zona rawan bencana, marker fasilitas, jalur evakuasi, dan titik mitigasi.

Sistem tidak menggunakan kolaborasi realtime. Fitur share tidak memberikan akses edit atau read-only terhadap project asli. Ketika user lain membuka share link, sistem akan membuat salinan project tersebut ke akun personal user penerima. Dengan demikian, project asli tetap aman dan tidak berubah.

## 4. Ruang Lingkup MVP

Fitur MVP yang harus tersedia:

1. Landing page dengan konsep 3D Earth cinematic.
2. Register, login, logout.
3. Dashboard project.
4. CRUD project pemetaan.
5. Share link project dengan mekanisme import/copy to personal project.
6. Workspace peta 2D.
7. Drawing polygon, rectangle, circle, marker, dan polyline.
8. Segmentasi lahan.
9. Segmentasi zona rawan bencana.
10. Titik mitigasi dan marker fasilitas penting.
11. Metadata JSON untuk setiap objek peta.
12. Layer control.
13. Popup atau panel detail objek.
14. Export GeoJSON.
15. Export gambar peta sederhana.
16. Dashboard ringkasan project.

## 5. Fitur Non-MVP

Fitur pengembangan:

1. 3D Earth cinematic penuh.
2. Animasi zoom dari Earth menuju lokasi project.
3. Export PDF lengkap.
4. Import GeoJSON, KML, atau Shapefile.
5. Analisis jarak ke titik mitigasi atau sumber daya terdekat.
6. Skoring prioritas mitigasi otomatis.
7. Riwayat perubahan objek peta.
8. Template metadata dinamis.
9. Integrasi data DEM/elevasi asli.
10. Integrasi data cuaca, sensor, atau API kebencanaan.
11. Validasi data oleh petugas.
12. Versioning project.

## 6. Aktor Sistem

### 6.1 Guest

Guest adalah pengguna yang belum login.

Hak akses:

1. Melihat landing page.
2. Login.
3. Register.
4. Membuka share link project.
5. Setelah membuka share link, guest diarahkan untuk login/register agar project dapat diimpor ke akun personal.

### 6.2 User

User adalah pengguna utama sistem.

Hak akses:

1. Membuat project pemetaan.
2. Mengedit project miliknya sendiri.
3. Menghapus project miliknya sendiri.
4. Membuka workspace peta.
5. Membuat segmentasi lahan.
6. Membuat zona rawan bencana.
7. Membuat titik mitigasi.
8. Membuat marker dan label.
9. Membuat jalur evakuasi.
10. Membuat share link project.
11. Mengimpor project dari share link user lain ke akun personal.
12. Export data project.

### 6.3 Admin

Admin adalah pengelola sistem.

Hak akses:

1. Mengelola user.
2. Melihat daftar project.
3. Menghapus project bermasalah.
4. Mengatur kategori default.
5. Mengatur jenis bencana default.
6. Mengatur level risiko default.

## 7. Aturan Bisnis Project

1. Satu user dapat memiliki banyak project.
2. Satu project hanya memiliki satu owner.
3. Project hasil import dari share link menjadi project baru milik user penerima.
4. Project asli tidak berubah ketika dibagikan.
5. Share link tidak memberikan akses edit terhadap project asli.
6. Share link tidak memberikan akses read-only permanen terhadap project asli.
7. User yang membuka share link harus login untuk menyimpan salinan project.
8. Project dapat berstatus draft, active, archived, atau imported.
9. Setiap objek peta harus terikat ke `project_id`.

## 8. Aturan Share Project

1. Owner dapat membuat share link dari project miliknya.
2. Share link berisi token unik.
3. Ketika token dibuka, sistem menampilkan preview informasi project.
4. User harus login untuk melakukan import.
5. Setelah import, sistem menyalin:
   - Data project
   - Layer
   - Category
   - Map objects
   - Geometry
   - Metadata
   - Label config
   - Style config
6. Project hasil import diberi owner baru sesuai user penerima.
7. Nama project hasil import dapat diberi prefix/suffix, misalnya `Copy of Nama Project`.
8. Activity log mencatat proses share dan import.

## 9. Aturan Layer

1. Primary layer hanya boleh aktif satu dalam satu waktu.
2. Primary layer:
   - Segmentasi Lahan
   - Risiko Bencana
   - Elevasi
3. Overlay layer boleh aktif bersamaan.
4. Overlay layer:
   - Marker / Label
   - Jalur Evakuasi
   - Titik Mitigasi
5. Aturan ini mencegah konflik warna antar layer polygon.

## 10. Aturan Drawing

1. User dapat menggambar objek peta pada project miliknya.
2. Bentuk objek yang didukung:
   - Point
   - LineString
   - Polygon
   - Rectangle
   - Circle
3. Setelah menggambar objek, user wajib mengisi data utama.
4. Untuk polygon, rectangle, dan circle, sistem menghitung luas area.
5. Untuk polyline, sistem menghitung panjang garis.
6. Semua geometry disimpan dalam format JSON/GeoJSON.
7. Metadata tambahan disimpan dalam format JSON.

## 11. Segmentasi Lahan

Segmentasi lahan digunakan untuk memetakan penggunaan area.

Kategori awal:

1. Pertanian
2. Perkebunan
3. Permukiman
4. Lahan kosong
5. Fasilitas umum
6. Hutan
7. Industri
8. Perairan
9. Jalan

Contoh metadata lahan:

```json
{
  "status_lahan": "produktif",
  "jenis_tanaman": "padi",
  "sistem_irigasi": "teknis",
  "catatan": "saluran air perlu diperbaiki"
}
```

## 12. Zona Rawan Bencana

Zona rawan bencana digunakan untuk menandai area dengan potensi bahaya.

Jenis bencana awal:

1. Banjir
2. Longsor
3. Kebakaran hutan/lahan
4. Gempa bumi
5. Tsunami
6. Kekeringan
7. Abrasi
8. Erupsi gunung api
9. Angin puting beliung

Tingkat risiko:

1. Aman
2. Rendah
3. Sedang
4. Tinggi
5. Ekstrem

Contoh metadata bencana:

```json
{
  "riwayat_kejadian": "sering",
  "jumlah_kk_terdampak": 85,
  "akses_jalan": "rawan terputus",
  "rekomendasi": "siapkan posko dan perahu karet"
}
```

## 13. Titik Mitigasi dan Marker

Titik mitigasi digunakan untuk memvisualisasikan fasilitas dan sumber daya pendukung.

Kategori marker:

1. Tempat ibadah
2. Sekolah
3. Puskesmas
4. Kantor desa
5. Jembatan
6. Posko
7. Titik kumpul
8. Gudang logistik
9. Alat berat
10. Sumber air

Contoh metadata titik mitigasi:

```json
{
  "jenis": "posko",
  "kapasitas": 120,
  "status": "siap digunakan",
  "catatan_akses": "jalan utama dapat dilalui kendaraan logistik"
}
```

## 14. Tech Stack

### Frontend

1. Next.js
2. TypeScript
3. Tailwind CSS
4. React Leaflet
5. Leaflet Draw
6. CesiumJS untuk 3D Earth

### Backend

1. Next.js API Route atau Route Handler
2. Prisma ORM
3. PostgreSQL
4. PostGIS opsional untuk query spasial lanjutan

### Storage dan Deployment

1. Supabase Storage atau S3-compatible storage
2. Vercel
3. Supabase/Railway untuk database PostgreSQL

## 15. Struktur Halaman

1. `/` — Landing page SIGMANTA
2. `/login` — Login
3. `/register` — Register
4. `/dashboard` — Dashboard user
5. `/projects` — Daftar project
6. `/projects/create` — Buat project
7. `/projects/[id]` — Detail project
8. `/projects/[id]/map` — Workspace peta
9. `/projects/[id]/segments` — Data segmentasi
10. `/projects/[id]/markers` — Data marker
11. `/projects/[id]/share` — Share project
12. `/share/[token]` — Preview dan import project dari share link
13. `/settings` — Pengaturan akun

## 16. Output Sistem

1. Peta interaktif segmentasi lahan.
2. Peta zona rawan bencana alam.
3. Peta marker fasilitas penting.
4. Peta titik mitigasi.
5. Peta jalur evakuasi.
6. Rekap luas area berdasarkan kategori.
7. Rekap luas area rawan berdasarkan tingkat risiko.
8. Export GeoJSON.
9. Export PNG.
10. Project hasil import dari share link.
11. Laporan ringkas kondisi wilayah.

## 17. ERD Konseptual Revisi

Entity utama:

1. users
2. mapping_projects
3. project_share_links
4. project_imports
5. project_layers
6. categories
7. risk_levels
8. map_objects
9. map_exports
10. activity_logs

Perubahan penting dari konsep sebelumnya:

1. `project_members` dihapus.
2. `project_invitations` dihapus.
3. Tidak ada role editor/viewer per project.
4. Sharing menggunakan model copy/import.
5. Project hasil import menjadi project baru milik user penerima.

## 18. API Utama

1. `POST /api/projects`
2. `GET /api/projects`
3. `GET /api/projects/:id`
4. `PATCH /api/projects/:id`
5. `DELETE /api/projects/:id`
6. `POST /api/projects/:id/share-links`
7. `GET /api/share/:token`
8. `POST /api/share/:token/import`
9. `POST /api/projects/:id/map-objects`
10. `GET /api/projects/:id/map-objects`
11. `PATCH /api/map-objects/:id`
12. `DELETE /api/map-objects/:id`
13. `POST /api/projects/:id/export`

## 19. Alur Penggunaan

1. User membuka landing page SIGMANTA.
2. User login atau register.
3. User masuk dashboard.
4. User membuat project pemetaan.
5. User masuk ke workspace peta.
6. User membuat segmentasi lahan, zona rawan bencana, dan titik mitigasi.
7. Sistem menghitung luas atau panjang objek.
8. Sistem menyimpan geometry dan metadata.
9. User dapat export project.
10. User dapat membuat share link.
11. Penerima membuka share link.
12. Penerima login dan mengimpor project.
13. Project hasil import masuk ke dashboard personal penerima.

## 20. Roadmap Implementasi

### Phase 0 — Setup

1. Init Next.js TypeScript.
2. Setup Tailwind CSS.
3. Setup Prisma.
4. Setup PostgreSQL.
5. Setup environment variable.

### Phase 1 — Authentication

1. Register.
2. Login.
3. Logout.
4. Protected route.

### Phase 2 — Project Management

1. CRUD project.
2. Default layer.
3. Dashboard project.

### Phase 3 — Share and Import Project

1. Generate share token.
2. Preview share link.
3. Import project ke akun personal.
4. Clone layer, category, map object, geometry, metadata, label, dan style.
5. Catat activity log.

### Phase 4 — Map Workspace

1. Render peta 2D.
2. Layer control.
3. Drawing tools.
4. Object detail panel.

### Phase 5 — Map Object CRUD

1. Simpan geometry.
2. Simpan metadata.
3. Edit object.
4. Delete object.
5. Render ulang object.

### Phase 6 — Segmentasi dan Mitigasi

1. Segmentasi lahan.
2. Zona rawan bencana.
3. Titik mitigasi.
4. Marker fasilitas.
5. Jalur evakuasi.

### Phase 7 — Export dan Dashboard Summary

1. Export GeoJSON.
2. Export PNG.
3. Ringkasan jumlah objek.
4. Ringkasan luas area.

## 21. Definition of Done

Satu fitur dianggap selesai apabila:

1. API selesai.
2. UI minimal tersedia.
3. Permission owner berjalan.
4. Validasi input berjalan.
5. Error handling tersedia.
6. Data tersimpan ke database.
7. Data dapat ditampilkan ulang.
8. Manual test berhasil.
9. Tidak merusak fitur lain.
