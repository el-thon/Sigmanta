# SIGMANTA — Master Design Prompt

> Gunakan prompt ini secara utuh saat meminta AI atau developer untuk mengimplementasikan UI/UX SIGMANTA. Prompt ini mencakup arah desain, sistem warna, layout, animasi, dan komponen per halaman.

---

## 0. Konteks Sistem

**SIGMANTA** adalah platform WebGIS untuk pemetaan lahan, zona rawan bencana, dan titik mitigasi berbasis peta interaktif. Target pengguna adalah petugas lapangan, pengelola wilayah, dan relawan bencana. Sistem ini harus terasa **serius, tepercaya, dan fungsional** — bukan dekoratif.

---

## 1. Arah Estetika Global

**Gaya utama:** Neo-brutalism + Bento Grid + Liquid Glass accent  
**Tone:** Raw, grounded, fungsional — bukan futuristik atau sci-fi  
**Keyword desain:** Earthy authority, cartographic precision, quiet brutalism

### Prinsip Utama

- **Bukan dark-mode neon, bukan glassmorphism penuh.** Liquid glass hanya digunakan sebagai aksen elemen tertentu (navbar, card overlay di atas peta, modal), bukan seluruh halaman.
- **Neo-brutalism versi halus:** border tebal tapi tidak agresif, offset shadow hitam tipis (4–6px), grid ketat, tipografi besar dan tegas.
- **Bento Grid:** Layout dashboard dan landing page menggunakan bento-style grid — ukuran tile berbeda, asimetris, tapi tetap dalam grid yang teratur.
- **Minimalist:** Tidak ada ornamen dekoratif berlebihan. Setiap elemen harus memiliki fungsi.
- **3D hanya di landing page** — digunakan untuk hero globe dan section peta global dataset publik, bukan di workspace editing atau dashboard.

---

## 2. Sistem Warna

### Palet Utama

```
--color-earth-dark:    #1C1A14   /* Background utama dark mode */
--color-earth-mid:     #2E2B1F   /* Surface card dark */
--color-earth-light:   #F5F0E8   /* Background utama light mode */
--color-earth-paper:   #EDE8DC   /* Surface card light */

--color-moss:          #3B6D11   /* Aksen hijau — zona aman, lahan */
--color-moss-light:    #C0DD97   /* Fill hijau muda */
--color-hazard:        #D85A30   /* Aksen oranye-merah — zona bencana */
--color-hazard-light:  #F5C4B3   /* Fill bahaya muda */
--color-water:         #185FA5   /* Aksen biru — perairan, jalur evakuasi */
--color-water-light:   #B5D4F4   /* Fill biru muda */
--color-amber-warn:    #BA7517   /* Warning — risiko sedang */
--color-neutral:       #888780   /* Teks sekunder, border muted */

--color-border-brutal: #1C1A14   /* Border neo-brutalism (dark) */
--color-shadow-brutal: rgba(28, 26, 20, 0.85)  /* Offset shadow */
```

### Aturan Warna

- Background utama: `--color-earth-light` (light mode) / `--color-earth-dark` (dark mode)
- Card dan surface: slight off-white / off-black, BUKAN pure white atau pure black
- Accent warna mengikuti semantik peta: hijau = aman/lahan, merah-oranye = bahaya, biru = air/evakuasi, amber = risiko sedang
- Tidak ada purple gradient. Tidak ada neon. Tidak ada pastel lembek.

---

## 3. Tipografi

```
Display font:  "Fraunces" (variable, Google Fonts) — untuk heading besar, hero title
Body font:     "DM Mono" (Google Fonts) — untuk teks UI, label peta, form atribut, dan legenda
Accent:        "Instrument Serif" italic — untuk tagline, quote, kalimat hero
```

### Skala Tipografi

| Role | Font | Size | Weight | Style |
|------|------|------|--------|-------|
| Hero display | Fraunces | clamp(3rem, 8vw, 7rem) | 700 | normal |
| Section heading | Fraunces | 2.5rem | 600 | normal |
| Card title | DM Mono | 1rem | 500 | uppercase + letter-spacing |
| Body/label | DM Mono | 0.875rem | 400 | normal |
| Tagline/accent | Instrument Serif | 1.25rem | 400 | italic |

### Aturan Tipografi

- Heading menggunakan Fraunces — karakternya organik, editorial, tidak terasa tech-company biasa
- Semua label UI menggunakan DM Mono — memberikan nuansa kartografis/teknis
- Letter-spacing pada uppercase label: `0.12em`
- Line-height body: `1.65`

---

## 4. Layout System

### Grid

```css
--grid-cols: 12;
--grid-gap: 1.5rem;
--container-max: 1440px;
--container-padding: clamp(1rem, 4vw, 4rem);
```

### Bento Grid Rules

- Gunakan `display: grid` dengan `grid-template-columns` yang bervariasi
- Tile bento minimal memiliki 3 ukuran berbeda dalam satu layout:
  - **Large tile:** `col-span-8`, tinggi `min-h-[320px]`
  - **Medium tile:** `col-span-4`, tinggi `min-h-[160px]`
  - **Small tile:** `col-span-2` atau `col-span-3`
- Gap antar tile: `1.5rem` — cukup untuk terlihat terstruktur
- Setiap tile bento memiliki border brutal: `2px solid --color-border-brutal` + `box-shadow: 4px 4px 0px --color-shadow-brutal`

### Neo-Brutalism Card Style

```css
.card-brutal {
  border: 2px solid var(--color-border-brutal);
  box-shadow: 4px 4px 0px var(--color-shadow-brutal);
  border-radius: 4px; /* Minimal radius — hampir sharp */
  background: var(--color-earth-paper);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card-brutal:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px var(--color-shadow-brutal);
}
```

### Liquid Glass Accent (Terbatas)

Hanya digunakan pada:
1. Navbar saat di-scroll (backdrop-filter blur)
2. Card yang melayang di atas peta (map overlay panel)
3. Modal/dialog box

```css
.glass-accent {
  background: rgba(245, 240, 232, 0.72); /* light mode */
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  border: 1px solid rgba(28, 26, 20, 0.15);
  border-radius: 8px;
}

/* Dark mode */
.glass-accent-dark {
  background: rgba(28, 26, 20, 0.68);
  backdrop-filter: blur(16px) saturate(1.6);
  border: 1px solid rgba(245, 240, 232, 0.1);
}
```

---

## 5. Landing Page (`/`)

### 5.1 Hero Section

**Layout:** Full viewport height (`100dvh`), tidak ada scroll di dalam section ini.

**Elemen:**

1. **Globe 3D** — posisi kanan layar, berputar pelan (yaw 360° / 40 detik). Gunakan salah satu:
   - CesiumJS dalam mode globe sederhana tanpa atmosphere effect berlebihan
   - Three.js sphere dengan texture peta topografi earthy (warna sepia/muted, bukan biru terang standar)
   - Alternativ ringan: CSS 3D sphere dengan gradient radial berlapis untuk kesan kedalaman
   - Globe tidak full-screen — ukuran `600px × 600px`, diposisikan `right: -80px, top: 50%, transform: translateY(-50%)` sehingga sedikit terpotong di kanan

2. **Text area** — posisi kiri, lebar ~50% layar

3. **Typewriter cycling text** — kalimat berganti secara otomatis, satu karakter muncul satu per satu:

```
Kalimat 1:  "Selamatkan Bumi."
Kalimat 2:  "Petakan Risiko."
Kalimat 3:  "Lindungi Wilayahmu."
Kalimat 4:  "Data Geospasial untuk Keputusan Nyata."
Kalimat 5:  "Mitigasi Dimulai dari Peta."
```

**Mekanisme animasi typewriter:**

```javascript
// Pseudocode logic
const phrases = [
  "Selamatkan Bumi.",
  "Petakan Risiko.",
  "Lindungi Wilayahmu.",
  "Data Geospasial untuk Keputusan Nyata.",
  "Mitigasi Dimulai dari Peta."
];

// Setiap karakter muncul satu per satu dengan delay 55ms
// Setelah kalimat selesai, pause 2200ms
// Kemudian karakter hilang satu per satu (erase) dengan delay 30ms
// Kemudian ganti ke kalimat berikutnya
// Loop tanpa henti
```

**Cursor:** Blinking cursor `|` mengikuti posisi karakter terakhir, blink setiap 530ms.

4. **Sub-tagline** (muncul dengan fade-in setelah kalimat pertama selesai):
   > *"Platform WebGIS untuk pemetaan lahan, identifikasi zona rawan bencana, dan pengelolaan titik mitigasi."*
   Font: Instrument Serif italic, ukuran 1.1rem, warna `--color-neutral`

5. **CTA Button pair:**
   - Primary: `[Mulai Pemetaan →]` — brutal card style, background `--color-moss`, text putih
   - Secondary: `[Lihat Demo]` — outline brutal style, border hitam

6. **Background hero:**
   - Base: `--color-earth-light`
   - Texture: subtle topographic contour lines (SVG pattern, opacity 0.06) — seperti kertas peta lama
   - Tidak ada gradient mesh agresif

### 5.2 Section Transisi: Scroll Indicator

Elemen kecil di bawah hero: `[↓ Scroll untuk jelajahi]` dengan animasi bounce pelan. Saat user scroll, hero section fade-out dengan parallax ringan (globe bergerak lebih lambat dari text).

### 5.3 Section: Peta Persebaran Data Lingkungan Dunia

Section peta global berada setelah hero/scroll indicator dan sebelum bento fitur utama. Tujuannya memperlihatkan konteks global dari dataset publik, bukan mempromosikan teknologi engine.

**Copywriting UI:**

- Judul utama: `Peta persebaran data lingkungan dan risiko di dunia.`
- Label kecil: `Peta Global`
- Header panel peta: `Peta Persebaran Data Publik`
- Hindari teks yang menonjolkan nama engine seperti `CesiumJS Public Layer Viewer` pada UI publik.
- Nama engine 3D boleh dicatat di dokumentasi teknis atau komentar developer, tetapi bukan headline/label user-facing.

**Layout:**

```
┌──────────────────────┬──────────────────────────────────────┐
│ Filter + Search      │ Peta globe 3D                         │
│ Layer toggle         │ Hover detail + attribution            │
└──────────────────────┴──────────────────────────────────────┘
```

- Grid desktop: `330px 1fr`.
- Grid harus menggunakan `align-items: start` agar panel peta tidak ikut memanjang setinggi sidebar filter.
- Tinggi viewer:
  - Mobile: `460px`
  - Desktop/tablet: `540px`
- Tidak boleh ada ruang kosong besar di bawah globe; wrapper peta harus mengikuti tinggi canvas/viewport peta.
- Sidebar filter boleh lebih tinggi dari panel peta dan tidak memaksa panel peta ikut stretch.

**Data dan layer:**

Layer filter menampilkan semua kategori yang disiapkan:

1. Gempa Bumi.
2. Kejadian Alam Aktif.
3. Hotspot & Kebakaran.
4. Kualitas Udara.

Sumber data yang ditampilkan atau dikonfigurasi:

1. **USGS Earthquake GeoJSON** — live, endpoint `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`.
2. **NASA EONET GeoJSON** — near real-time, endpoint `https://eonet.gsfc.nasa.gov/api/v3/events/geojson`.
3. **NASA FIRMS** — hotspot/kebakaran jika `NASA_FIRMS_MAP_KEY` tersedia; fallback wildfire berasal dari NASA EONET.
4. **OpenAQ** — kualitas udara jika `OPENAQ_API_KEY` tersedia.

Jangan tampilkan layer yang belum memiliki data live atau adapter data yang jelas. Deforestasi, penambangan, wilayah tercemar non-udara, elevasi/terrain, dan boundary publik dapat ditambahkan lagi setelah ada integrasi tile/GeoJSON yang nyata.

**Hover detail:**

Panel hover harus menampilkan:

- Nama fitur.
- Ringkasan.
- Detail teknis kategori: gempa menampilkan magnitude/kedalaman/status USGS; kejadian alam menampilkan kategori/tanggal/koordinat EONET; hotspot menampilkan brightness/confidence/FRP/satelit/instrumen FIRMS.
- Untuk kualitas udara: nilai konsentrasi, satuan dari metadata parameter OpenAQ, nilai interpretasi setara `µg/m³` jika ada konversi, status interpretasi, deskripsi dampak singkat, dan standar baca.
- Source.
- License.
- Confidence.
- Waktu import.
- Link sumber.
- Tombol `Import ke project` hanya untuk user login. Guest tidak melihat tombol import.
- Modal import menampilkan nama fitur, ringkasan, pilihan project tujuan, status sukses/gagal, dan link `Buka workspace` setelah import berhasil.

**Visual:**

- Gunakan globe textured dengan imagery bumi yang terbaca, bukan ellipsoid biru polos.
- Label titik boleh kecil, tetapi tidak boleh menutupi seluruh globe. Jika label terlalu padat, prioritaskan point marker dan munculkan detail lewat hover.
- Warna marker mengikuti kategori layer dan tetap kontras terhadap imagery bumi.

### 5.4 Section: Fitur Utama (Bento Grid)

**Judul section:**
```
"Satu Platform.
Semua yang Kamu Butuhkan."
```

**Bento tile layout (12 kolom):**

```
┌──────────────────────────┬────────────┬────────────┐
│  TILE A (col-8)          │  TILE B    │  TILE C    │
│  Pemetaan Lahan          │  Zona      │  Share     │
│  Interaktif              │  Bencana   │  Project   │
│  [Animasi mini peta]     │            │            │
├─────────────┬────────────┴────────────┬────────────┤
│  TILE D     │  TILE E (col-6)         │  TILE F    │
│  Export     │  Digitasi Multi-Bentuk  │  Titik     │
│  PDF/GeoJSON│  Polygon, Circle, dll   │  Mitigasi  │
└─────────────┴─────────────────────────┴────────────┘
```

**Setiap tile bento memiliki:**
- Icon besar (Tabler outline, 48px) di pojok kanan atas
- Judul dengan DM Mono uppercase
- Deskripsi singkat 1–2 baris
- Warna aksen berbeda tiap tile (moss, water, hazard, amber, neutral)

### 5.5 Section: Cara Kerja

Layout: horizontal step-by-step dengan connector line tipis.

5 langkah:
1. Buat Project
2. Buka Workspace Peta
3. Gambar & Segmentasi
4. Isi Atribut Objek
5. Export & Bagikan

Animasi: saat scroll masuk viewport, setiap step muncul berurutan dengan `staggered animation-delay` (0ms, 150ms, 300ms, 450ms, 600ms).

### 5.6 Section: Call to Action Akhir

Background: `--color-earth-dark` (inverted section)  
Teks besar: *"Mulai pemetaan wilayahmu hari ini."*  
Ukuran: clamp(2rem, 5vw, 4rem), font Fraunces  
CTA: Satu tombol besar brutal style.

---

## 6. Animasi & Transisi

### 6.1 Page Transition

Gunakan CSS `View Transition API` (atau GSAP/Framer Motion jika Next.js):

```css
/* Page exit */
@keyframes page-exit {
  from { opacity: 1; transform: translateY(0); filter: blur(0); }
  to   { opacity: 0; transform: translateY(-24px); filter: blur(4px); }
}

/* Page enter */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(24px); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}
```

Durasi: `350ms ease` untuk exit, `400ms ease` untuk enter.

### 6.2 Scroll-Triggered Section Reveal

```css
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}
```

Gunakan `IntersectionObserver` dengan `threshold: 0.15`.

Implementasi saat ini menggunakan kombinasi `MotionReveal` berbasis Framer Motion untuk section utama dan native CSS keyframes untuk hero copy, CTA, globe float, scroll indicator, bento hover, stagger step, smooth scroll, serta reduced-motion guard.

### 6.3 Bento Tile Hover

```css
.bento-tile {
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.18s ease;
}

.bento-tile:hover {
  transform: translate(-3px, -3px);
  box-shadow: 6px 6px 0px var(--color-shadow-brutal);
}
```

Spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) memberikan bounce kecil yang terasa alami.

### 6.4 Globe Rotation (Three.js / CSS 3D)

```javascript
// Three.js
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.0015; // lambat, elegan
  renderer.render(scene, camera);
}
```

Atmosphere: subtle rim light dengan warna `--color-moss-light` (hijau muted), bukan biru neon.

### 6.5 Typewriter Animation Detail

```javascript
class TypeWriter {
  constructor(el, phrases) {
    this.el = el;
    this.phrases = phrases;
    this.phraseIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.typeSpeed = 55;   // ms per karakter saat menulis
    this.deleteSpeed = 30; // ms per karakter saat menghapus
    this.pauseAfterWrite = 2200; // ms setelah kalimat selesai
    this.pauseBeforeWrite = 400; // ms sebelum mulai kalimat baru
  }

  tick() {
    const phrase = this.phrases[this.phraseIndex];
    const current = phrase.substring(0, this.charIndex);
    this.el.textContent = current;

    if (!this.isDeleting && this.charIndex === phrase.length) {
      setTimeout(() => { this.isDeleting = true; this.tick(); }, this.pauseAfterWrite);
      return;
    }

    if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      setTimeout(() => this.tick(), this.pauseBeforeWrite);
      return;
    }

    this.charIndex += this.isDeleting ? -1 : 1;
    setTimeout(() => this.tick(), this.isDeleting ? this.deleteSpeed : this.typeSpeed);
  }
}
```

### 6.6 Parallax Hero

Saat user scroll dari hero section:
- Globe bergerak ke atas dengan `translateY(-scrollY * 0.3)` (lebih lambat dari scroll)
- Text area bergerak dengan `translateY(-scrollY * 0.6)` (lebih cepat)
- Background texture bergerak dengan `translateY(-scrollY * 0.1)` (paling lambat)

Implementasi: `requestAnimationFrame` + `window.scrollY` listener.

---

## 7. Navbar

### Struktur

```
[SIGMANTA ⬛]          [Fitur]  [Cara Kerja]  [Tentang]          [Masuk]  [Daftar →]
```

- Logo: nama "SIGMANTA" dalam Fraunces bold + icon mini square (konsisten dengan brutal aesthetic)
- Links: DM Mono uppercase, font-size 0.8rem, letter-spacing 0.1em
- State awal: transparent background
- State scroll (>80px): glass accent effect (`backdrop-filter: blur(12px)`) + border-bottom `1px solid rgba(..., 0.12)`
- CTA "Daftar": brutal button style (border 2px solid, box-shadow 3px 3px 0px)

---

## 8. Dashboard (`/dashboard` dan `/projects`)

### Layout

Sidebar kiri (240px) + konten utama.

**Sidebar:**
- Background: `--color-earth-mid` (dark) / `--color-earth-paper` (light)
- Border kanan: `2px solid --color-border-brutal`
- Nav items: DM Mono, uppercase, icon Tabler di kiri
- Active state: background tile dengan offset shadow kecil (brutal pill)

**Content area:**

Bento grid 3 kolom untuk daftar project:

```
┌──────────────────────────────────────────────────────┐
│  [+ Buat Project Baru]     [Search...]  [Filter ▼]  │
├────────────────┬──────────────────┬──────────────────┤
│  Project A     │  Project B       │  Project C       │
│  Status: aktif │  Status: draft   │  Status: impor   │
│  12 obj · 3ha  │  5 obj · 0.8ha   │  8 obj · 2.1ha  │
│  [Buka Peta]   │  [Buka Peta]     │  [Buka Peta]    │
├────────────────┴──────────────────┴──────────────────┤
│  Project D              │  Project E                  │
│  (tile lebih lebar)     │  (tile standar)             │
└─────────────────────────┴─────────────────────────────┘
```

**Project Card Style:**
- Brutal card dengan border 2px + offset shadow 4px
- Status badge: DM Mono uppercase, background warna sesuai status:
  - `active` → moss green
  - `draft` → amber
  - `archived` → neutral gray
  - `imported` → water blue
- Thumbnail mini-peta jika tersedia (screenshot terakhir), atau placeholder topographic pattern

---

## 9. Workspace Peta (`/projects/[id]/map`)

### Layout

```
┌────────┬───────────────────────────────────────────────────┐
│ PANEL  │                                                   │
│ KIRI   │              LEAFLET MAP AREA                    │
│ (280px)│                                                   │
│        │                                                   │
│ Layer  │           (peta 2D full-remaining width)          │
│ Control│                                                   │
│        │                                    ┌───────────┐ │
│ Draw   │                                    │ PANEL     │ │
│ Tools  │                                    │ DETAIL    │ │
│        │                                    │ (320px)   │ │
└────────┴────────────────────────────────────┴───────────┘
```

**Panel Kiri (Layer Control & Tools):**
- Glass accent style — karena berada di atas peta
- Border kanan brutal: `2px solid`
- Tombol drawing tools: brutal icon buttons, active state dengan offset shadow inverted

**Panel Detail Objek (kanan, slide-in):**
- Muncul saat user klik objek di peta
- Animasi: slide in dari kanan `translateX(100%) → translateX(0)` dengan `ease-out 280ms`
- Glass accent + brutal border kiri
- Saat objek zona rawan bencana dipilih, panel menampilkan kandidat titik mitigasi/marker terdekat dari PostGIS nearby, kontrol radius, status fallback, dan pilihan target rute evakuasi.

**Peta sendiri:** Tile default Leaflet, tapi ubah tile layer ke CartoDB Dark Matter atau CartoDB Voyager (lebih earthy, bukan OpenStreetMap default).

---

## 10. Export PDF Laporan Peta

Export PDF harus terasa seperti lampiran peta profesional, bukan hanya screenshot mentah dari browser. Layoutnya mengikuti pola kartografis: peta dominan, legenda jelas, blok identitas, skala, arah utara, dan ringkasan data yang berasal dari objek pada peta.

### Layout PDF A4 Landscape

```
┌──────────────────────────────────────────────┬───────────────────┐
│                                              │  LOGO / IDENTITAS │
│                                              │  Project, User    │
│                                              ├───────────────────┤
│              AREA PETA UTAMA                 │  RINGKASAN DATA   │
│  - objek segmentasi                          │  - jumlah objek   │
│  - zona risiko                               │  - luas area      │
│  - marker/titik mitigasi                     │  - risiko tinggi  │
│  - jalur evakuasi                            ├───────────────────┤
│                                              │  LEGENDA          │
│                                              │  Layer/Kategori   │
│                                              │  Tingkat Risiko   │
├──────────────────────────────────────────────┴───────────────────┤
│  Arah utara | skala jarak | tanggal export | sumber data project │
└──────────────────────────────────────────────────────────────────┘
```

### Elemen Visual Wajib

1. **Judul peta**: nama project sebagai heading utama, lokasi sebagai subheading.
2. **Peta utama**: gambar viewport peta yang sedang diexport, termasuk overlay objek yang aktif.
3. **Legenda**: warna dan label layer, kategori lahan, jenis bencana, dan tingkat risiko yang muncul.
4. **Ringkasan berdasarkan gambar peta**: jumlah objek terlihat, luas total area terlihat, jumlah zona risiko, jumlah titik mitigasi, dan estimasi rute bila ada.
5. **Skala**: bar skala horizontal seperti `0 | 2.5 | 5 | 7.5 | 10 km` atau estimasi sesuai zoom.
6. **Arah utara**: icon north arrow sederhana, hitam-putih, ditempatkan di area peta.
7. **Grid atau label koordinat**: label koordinat tepi peta bila memungkinkan, cukup ringkas agar tidak mengganggu objek.
8. **Blok identitas**: nama user/exporter, tanggal export, nama sistem SIGMANTA, dan opsional logo/institusi.
9. **Inset/overview map opsional**: peta kecil lokasi umum project bila data tersedia.

### Gaya Visual PDF

- Background dominan putih atau `earth-light` agar mudah dicetak.
- Peta memakai border tipis hitam, bukan brutal shadow besar.
- Panel informasi kanan/bawah boleh memakai border 1-2px dengan spacing rapat.
- Legenda harus memakai swatch warna yang sama dengan objek di workspace.
- Teks laporan memakai DM Mono untuk label teknis dan Fraunces untuk judul.
- PDF harus tetap terbaca saat dicetak pada A4 landscape.

### Anti-Pattern Export PDF

- Jangan export hanya gambar canvas tanpa judul, legenda, atau ringkasan.
- Jangan tampilkan field JSON mentah di PDF.
- Jangan membuat legenda berisi layer yang tidak sedang tampil.
- Jangan memakai efek UI seperti shadow brutal berlebihan di dokumen cetak.

---

## 11. Komponen UI Kunci

### Status Badge

```css
.badge {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 3px 10px;
  border: 1.5px solid currentColor;
  border-radius: 2px; /* hampir sharp */
}
```

### Tombol Primer

```css
.btn-primary {
  background: var(--color-moss);
  color: #fff;
  border: 2px solid var(--color-border-brutal);
  box-shadow: 3px 3px 0px var(--color-shadow-brutal);
  font-family: 'DM Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  padding: 10px 24px;
  border-radius: 3px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0px var(--color-shadow-brutal);
}

.btn-primary:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px var(--color-shadow-brutal);
}
```

### Input Field

```css
.input-brutal {
  border: 2px solid var(--color-border-brutal);
  border-radius: 3px;
  background: var(--color-earth-light);
  font-family: 'DM Mono', monospace;
  font-size: 0.875rem;
  padding: 10px 14px;
  width: 100%;
  transition: box-shadow 0.15s ease;
}

.input-brutal:focus {
  outline: none;
  box-shadow: 3px 3px 0px var(--color-moss);
}
```

### Form Atribut Objek

User tidak perlu mengisi JSON manual. Semua atribut objek harus diatur melalui field UI yang jelas agar cocok untuk petugas lapangan dan pengguna non-teknis.

Field umum:

1. Nama objek.
2. Label peta.
3. Kategori.
4. Tingkat risiko, khusus zona rawan bencana.
5. Deskripsi.
6. Catatan lapangan.

```css
.object-attribute-panel {
  border: 2px solid var(--color-border-brutal);
  background: var(--color-earth-light);
  padding: 1rem;
  display: grid;
  gap: 0.875rem;
}

.object-attribute-panel label {
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.object-attribute-panel input,
.object-attribute-panel select,
.object-attribute-panel textarea {
  border: 2px solid var(--color-border-brutal);
  background: var(--color-earth-light);
  font-family: 'DM Mono', monospace;
  font-size: 0.875rem;
  border-radius: 3px;
  padding: 10px 14px;
}
```

---

## 12. Mood & Referensi Visual

**Referensi estetika yang dicari:**
- Tone warna: kertas peta topografi lama, sepia-earth, hijau vegetasi muted
- Kesan: akurasi cartographic + ketegasan brutalism + sedikit sentuhan editorial
- Bukan: dark cyberpunk, bukan pastel startup, bukan corporate blue gradient

**Anti-pattern (hindari):**
- ❌ Purple gradient
- ❌ Neon glow / glassmorphism full
- ❌ Rounded corner besar (>8px) di mana-mana
- ❌ Animasi berlebihan yang mengganggu fungsi
- ❌ Font Inter / Roboto / system-ui
- ❌ Globe biru terang seperti Google Earth standar

**Yang harus terasa:**
- ✅ Desain ini untuk pekerjaan serius (bencana, mitigasi)
- ✅ Terasa seperti alat profesional, bukan consumer app
- ✅ Earthy, grounded, tepercaya
- ✅ Setiap piksel punya tujuan

---

## 13. Implementasi Teknis (Next.js + Tailwind)

### Font Setup (next/font atau Google Fonts link)

```typescript
// app/layout.tsx
import { Fraunces, DM_Mono, Instrument_Serif } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono-ui',
  weight: ['400', '500'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-accent',
  weight: ['400'],
  style: ['italic'],
});
```

### Tailwind Config Extensions

```javascript
// tailwind.config.ts
extend: {
  colors: {
    earth: {
      dark: '#1C1A14',
      mid: '#2E2B1F',
      light: '#F5F0E8',
      paper: '#EDE8DC',
    },
    moss: {
      DEFAULT: '#3B6D11',
      light: '#C0DD97',
    },
    hazard: {
      DEFAULT: '#D85A30',
      light: '#F5C4B3',
    },
    water: {
      DEFAULT: '#185FA5',
      light: '#B5D4F4',
    },
  },
  fontFamily: {
    display: ['var(--font-display)', 'serif'],
    'mono-ui': ['var(--font-mono-ui)', 'monospace'],
    accent: ['var(--font-accent)', 'serif'],
  },
  boxShadow: {
    'brutal-sm': '3px 3px 0px rgba(28, 26, 20, 0.85)',
    'brutal-md': '4px 4px 0px rgba(28, 26, 20, 0.85)',
    'brutal-lg': '6px 6px 0px rgba(28, 26, 20, 0.85)',
    'brutal-hover': '6px 6px 0px rgba(28, 26, 20, 0.85)',
  },
  borderRadius: {
    'brutal': '3px',
    'brutal-md': '5px',
  },
}
```

### Page Transition (Framer Motion)

```typescript
// components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 24, filter: 'blur(4px)' },
  enter:   { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -24, filter: 'blur(4px)', transition: { duration: 0.35, ease: 'easeIn' } },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div variants={variants} initial="initial" animate="enter" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 14. Ringkasan Deliverable Desain

Ketika mengimplementasikan prompt ini, hasil akhir yang diharapkan:

| Halaman | Elemen Kunci |
|---------|-------------|
| Landing `/` | Hero 3D globe + typewriter cycling, bento feature grid, scroll-reveal section, topographic texture background |
| Dashboard `/dashboard` | Sidebar brutal, bento project grid, status badge earthy |
| Workspace `/projects/[id]/map` | Split-panel layout, glass overlay panel, Leaflet CartoDB tile |
| Export PDF | Layout A4 landscape berisi peta, legenda, skala, arah utara, ringkasan data, dan identitas export |
| Share Preview `/share/[token]` | Card preview project, CTA import brutal button |
| Auth `/login`, `/register` | Form minimal, brutal input + button, half-screen ilustrasi peta |

---

*Prompt ini dibuat sebagai design brief lengkap untuk SIGMANTA WebGIS. Versi: 1.0*
