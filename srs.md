# srs.md — SIGMANTA

## 0. Identitas Sistem

**Nama sistem:** SIGMANTA  
**Kepanjangan konsep:** Sistem Informasi Geografis Mitigasi dan Tata Area  
**Jenis sistem:** Platform WebGIS berbasis project  
**Fokus utama:** Pemetaan lahan, zona rawan bencana, titik mitigasi, dan layer referensi geospasial publik dalam peta interaktif 2D serta 3D Earth.

## 1. Deskripsi Project

SIGMANTA adalah platform WebGIS yang mengintegrasikan pemetaan lahan, identifikasi zona rawan bencana, pengelolaan titik mitigasi, dan layer referensi dataset publik dalam satu ekosistem geospasial. Sistem ini membantu pengguna memahami kondisi wilayah melalui segmentasi area, analisis risiko, visualisasi fasilitas mitigasi, serta konteks global seperti gempa, kejadian alam aktif, deforestasi, penambangan, polusi udara, kebakaran, cuaca ekstrem, dan layer lingkungan lain.

## 2. Tujuan Sistem

1. Menyediakan platform pemetaan lahan berbasis peta interaktif.
2. Menyediakan fitur identifikasi dan visualisasi kawasan rawan bencana alam.
3. Menyediakan fitur pengelolaan titik mitigasi seperti posko, titik kumpul, alat berat, fasilitas kesehatan, dan sumber daya pendukung.
4. Mendukung digitasi objek spasial berupa polygon, rectangle, circle, marker, dan polyline.
5. Menyimpan geometri objek dalam format JSON/GeoJSON.
6. Menyimpan atribut objek melalui field terstruktur yang diisi dari UI, seperti nama, label, kategori, tingkat risiko, deskripsi, dan catatan.
7. Menyediakan output peta interaktif, data GeoJSON, rekap luas area, dan laporan PDF ringkas project.
8. Mendukung mekanisme berbagi project melalui link yang akan mengimpor atau menyalin project ke akun personal penerima.
9. Menyediakan 3D Earth publik berbasis CesiumJS pada home page agar guest dan user dapat melihat layer referensi geospasial global.
10. Menyimpan metadata asal data publik seperti `source`, `source_url`, `source_license`, `imported_at`, dan `confidence` pada setiap fitur publik yang ditampilkan atau diimpor.

## 3. Konsep Utama Sistem

SIGMANTA menggunakan pendekatan **multi-project**. Setiap user dapat membuat project pemetaan sendiri. Di dalam project, user dapat membuat segmentasi lahan, zona rawan bencana, marker fasilitas, jalur evakuasi, dan titik mitigasi.

SIGMANTA juga menyediakan **public geospatial reference layer**. Layer ini berasal dari dataset publik dan ditampilkan sebagai konteks global, terutama pada 3D Earth CesiumJS di home page. Data referensi tidak otomatis menjadi data project. Jika user ingin menggunakan data publik tersebut, sistem harus melakukan import/copy ke project user dengan metadata provenance yang jelas.

Sistem tidak menggunakan kolaborasi realtime. Fitur share tidak memberikan akses edit atau read-only terhadap project asli. Ketika user lain membuka share link, sistem akan membuat salinan project tersebut ke akun personal user penerima. Dengan demikian, project asli tetap aman dan tidak berubah.

## 4. Ruang Lingkup MVP

Fitur MVP yang harus tersedia:

1. Landing page dengan 3D Earth berbasis CesiumJS yang dapat dilihat oleh guest dan user.
2. Register, login, logout.
3. Dashboard project.
4. CRUD project pemetaan.
5. Share link project dengan mekanisme import/copy to personal project.
6. Workspace peta 2D.
7. Drawing polygon, rectangle, circle, marker, dan polyline.
8. Segmentasi lahan.
9. Segmentasi zona rawan bencana.
10. Titik mitigasi dan marker fasilitas penting.
11. Form atribut objek peta berbasis UI.
12. Layer control.
13. Popup atau panel detail objek.
14. Export GeoJSON.
15. Export PDF laporan peta.
16. Dashboard ringkasan project.
17. Public dataset viewer pada home page dengan filter kategori, search, hover detail, dan metadata sumber data.

## 5. Fitur Non-MVP

Fitur pengembangan:

1. Animasi zoom dari Earth menuju lokasi project.
3. Export PDF lengkap dengan layout peta kartografis.
4. Import GeoJSON, KML, atau Shapefile.
5. Analisis jarak ke titik mitigasi atau sumber daya terdekat.
6. Skoring prioritas mitigasi otomatis.
7. Riwayat perubahan objek peta.
8. Integrasi data DEM/elevasi asli.
9. Integrasi data cuaca, sensor, atau API kebencanaan.
10. Integrasi public dataset tambahan dengan tile/raster service resmi.
11. Validasi data oleh petugas.
12. Versioning project.

## 6. Aktor Sistem

### 6.1 Guest

Guest adalah pengguna yang belum login.

Hak akses:

1. Melihat landing page.
2. Melihat 3D Earth public dataset viewer.
3. Memfilter dan mencari layer referensi publik.
4. Login.
5. Register.
6. Membuka share link project.
7. Setelah membuka share link, guest diarahkan untuk login/register agar project dapat diimpor ke akun personal.

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
13. Melihat public dataset pada 3D Earth.
14. Mengimpor fitur publik terpilih ke project sebagai objek editable.

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
   - Atribut objek
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
7. Atribut tambahan yang dibutuhkan user diisi melalui field UI yang jelas, bukan editor JSON manual.

## 10.1 Aturan Public Dataset dan Provenance

1. Dataset publik ditampilkan sebagai reference layer dan tidak diedit langsung.
2. Dataset publik dapat berasal dari API real-time, near real-time, atau dataset periodik resmi.
3. Setiap fitur publik wajib memiliki metadata provenance:
   - `source`: nama penyedia data.
   - `source_url`: URL endpoint, dokumentasi, atau halaman dataset.
   - `source_license`: lisensi atau ketentuan penggunaan.
   - `imported_at`: waktu data diambil oleh sistem.
   - `confidence`: tingkat keyakinan data, misalnya `high`, `medium`, `low`, atau angka 0 sampai 1.
4. Public dataset yang belum memiliki API key atau endpoint langsung tetap boleh dicatat sebagai configured layer, tetapi UI harus membedakan statusnya dari layer yang benar-benar live.
5. Jika user mengimpor data publik ke project, data hasil import menjadi object project dan menyimpan metadata provenance asalnya.
6. Public dataset viewer harus menyediakan filter kategori, search, toggle layer, dan hover detail.
7. Data publik yang dapat berubah cepat harus diambil melalui API route/proxy server agar key tidak bocor ke client dan format data dapat dinormalisasi.

## 10.2 Kategori Public Dataset

Kategori public dataset yang didukung secara bertahap:

1. Gempa bumi dan aktivitas seismik.
2. Kebakaran atau hotspot.
3. Cuaca ekstrem dan badai.
4. Banjir, longsor, kekeringan, dan kejadian alam aktif.
5. Aktivitas vulkanik.
6. Deforestasi dan perubahan tutupan pohon.
7. Area penambangan dan konsesi ekstraktif.
8. Kualitas udara dan wilayah tercemar udara.
9. Elevasi, terrain, dan DEM.
10. Tutupan lahan dan penggunaan lahan.
11. Batas administratif dan boundary publik.
12. Fasilitas umum dan infrastruktur dari dataset terbuka.

Sumber awal yang dapat digunakan:

1. USGS Earthquake GeoJSON feed untuk gempa real-time.
2. NASA EONET untuk kejadian alam aktif seperti wildfire, severe storm, volcano, drought, flood, landslide, dan sea/lake ice.
3. NASA FIRMS untuk hotspot/kebakaran jika `NASA_FIRMS_MAP_KEY` tersedia.
4. OpenAQ untuk kualitas udara jika `OPENAQ_API_KEY` tersedia.
5. Hansen Global Forest Change atau Global Forest Watch untuk deforestasi dan tree-cover loss.
6. OpenStreetMap/Overpass, geoBoundaries, GADM, atau data resmi pemerintah untuk boundary dan fasilitas.

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

Contoh atribut lahan yang diisi dari UI:

1. Nama objek lahan.
2. Label peta.
3. Kategori lahan.
4. Deskripsi kondisi lahan.
5. Catatan lapangan.

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

Contoh atribut zona rawan bencana yang diisi dari UI:

1. Nama zona.
2. Label peta.
3. Jenis bencana.
4. Tingkat risiko.
5. Deskripsi kondisi.
6. Catatan atau rekomendasi lapangan.

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

Contoh atribut titik mitigasi dan marker yang diisi dari UI:

1. Nama titik.
2. Label peta.
3. Kategori marker atau fasilitas.
4. Deskripsi fungsi titik.
5. Catatan akses atau kondisi lapangan.

## 14. Tech Stack

### Frontend

1. Next.js
2. TypeScript
3. Tailwind CSS
4. React Leaflet
5. Leaflet Draw
6. CesiumJS untuk 3D Earth
7. Public dataset viewer dengan filter, search, hover detail, dan layer toggle.

### Backend

1. Next.js API Route atau Route Handler
2. Prisma ORM
3. PostgreSQL
4. PostGIS opsional untuk query spasial lanjutan
5. API route/proxy untuk normalisasi dataset publik dan perlindungan API key.

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
14. `/api/public-datasets` — Proxy dan normalisasi public dataset untuk 3D Earth.

## 16. Output Sistem

1. Peta interaktif segmentasi lahan.
2. Peta zona rawan bencana alam.
3. Peta marker fasilitas penting.
4. Peta titik mitigasi.
5. Peta jalur evakuasi.
6. Rekap luas area berdasarkan kategori.
7. Rekap luas area rawan berdasarkan tingkat risiko.
8. Export GeoJSON.
9. Export PDF laporan peta.
10. Project hasil import dari share link.
11. Laporan ringkas kondisi wilayah.
12. 3D Earth publik dengan layer dataset global.
13. Detail provenance data publik saat hover atau memilih fitur.

## 16.1 Spesifikasi Export PDF Laporan Peta

Export PDF bukan sekadar gambar peta. PDF harus menjadi layout laporan peta yang dapat dipakai sebagai lampiran atau dokumen presentasi.

Elemen minimal PDF:

1. Judul project dan nama lokasi.
2. Gambar peta utama sesuai viewport atau area project yang sedang dibuka.
3. Overlay objek peta yang terlihat, termasuk segmentasi lahan, zona rawan bencana, marker, titik mitigasi, dan jalur evakuasi bila ada.
4. Legenda warna berdasarkan layer, kategori, dan tingkat risiko yang muncul pada peta.
5. Informasi jumlah objek terlihat.
6. Ringkasan luas area terpetakan.
7. Ringkasan luas area rawan berdasarkan tingkat risiko.
8. Informasi titik mitigasi atau marker yang tampil.
9. Skala peta atau estimasi jarak.
10. Arah utara.
11. Tanggal dan waktu export.
12. Identitas pembuat export atau nama user.

Layout PDF mengikuti gaya laporan peta kartografis:

1. Area peta utama berada di sisi kiri atau bagian dominan halaman.
2. Panel kanan atau bawah berisi judul, ringkasan, legenda, dan informasi project.
3. Bila memungkinkan, tampilkan grid/label koordinat pada tepi peta.
4. Warna legenda harus konsisten dengan warna objek di workspace.
5. PDF harus tetap terbaca saat dicetak pada ukuran A4 landscape.

## 16.2 Spesifikasi 3D Earth Public Dataset Viewer

3D Earth pada home page menggunakan CesiumJS dan dapat diakses tanpa login.

Kemampuan minimal:

1. Menampilkan globe 3D interaktif.
2. Menampilkan layer dataset publik sebagai titik, polygon, atau imagery/tile layer sesuai format sumber.
3. Menyediakan toggle kategori layer.
4. Menyediakan search berdasarkan nama, lokasi, kategori, dan sumber.
5. Menampilkan keterangan saat hover atau memilih fitur.
6. Menampilkan metadata provenance: source, URL sumber, lisensi, waktu import, dan confidence.
7. Menampilkan status layer: live, near real-time, periodik, butuh API key, atau configured.
8. Menyediakan fallback informatif jika sumber data tidak tersedia, API key belum dikonfigurasi, atau endpoint gagal.

CesiumJS digunakan untuk visualisasi 3D global. Workspace editing project tetap menggunakan peta 2D berbasis Leaflet karena proses menggambar dan mengedit polygon lebih ergonomis di 2D.

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
14. `GET /api/public-datasets`

## 19. Alur Penggunaan

1. User membuka landing page SIGMANTA.
2. User login atau register.
3. User masuk dashboard.
4. User membuat project pemetaan.
5. User masuk ke workspace peta.
6. User membuat segmentasi lahan, zona rawan bencana, dan titik mitigasi.
7. Sistem menghitung luas atau panjang objek.
8. Sistem menyimpan geometry dan atribut objek.
9. User dapat export project.
10. User dapat membuat share link.
11. Penerima membuka share link.
12. Penerima login dan mengimpor project.
13. Project hasil import masuk ke dashboard personal penerima.
14. Guest atau user dapat membuka home page dan melihat 3D Earth public dataset viewer.
15. User dapat memfilter/search public dataset dan melihat provenance setiap fitur.
16. User dapat memilih fitur publik sebagai referensi sebelum membuat atau mengimpor data ke project.

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
4. Clone layer, category, map object, geometry, atribut objek, label, dan style.
5. Catat activity log.

### Phase 4 — Map Workspace

1. Render peta 2D.
2. Layer control.
3. Drawing tools.
4. Object detail panel.

### Phase 4B — Public 3D Earth

1. Render CesiumJS globe di home page.
2. Ambil dataset publik melalui `/api/public-datasets`.
3. Normalisasi data menjadi fitur geospasial dengan metadata provenance.
4. Tampilkan layer toggle, search, filter kategori, dan hover detail.
5. Bedakan layer live, near real-time, periodik, configured, dan API-key-required.

### Phase 5 — Map Object CRUD

1. Simpan geometry.
2. Simpan atribut objek.
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
2. Export PDF laporan peta.
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
