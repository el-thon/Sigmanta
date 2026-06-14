import { ArrowRight, Download, Link, Map, MapPinned, Pencil, Pin, Route, TriangleAlert } from "lucide-react";
import type { CSSProperties } from "react";
import { EarthGlobe3D } from "@/components/EarthGlobe3D";
import { MotionReveal } from "@/components/MotionReveal";
import { PublicDatasetEarth } from "@/components/PublicDatasetEarth";
import { Typewriter } from "@/components/Typewriter";
import type { AuthUser } from "@/lib/auth";

const features = [
  {
    title: "Pemetaan Lahan Interaktif",
    body: "Gambar polygon dan rectangle untuk segmentasi wilayah langsung di peta.",
    tag: "Core",
    surfaceColor: "#171713",
    tone: "light",
    className: "md:col-span-7",
    height: "min-h-[282px]",
    icon: Map,
  },
  {
    title: "Zona Rawan Bencana",
    body: "9 jenis bencana, 5 tingkat risiko.",
    tag: "Safety",
    surfaceColor: "#df5732",
    tone: "light",
    className: "md:col-span-3",
    height: "min-h-[282px]",
    icon: TriangleAlert,
  },
  {
    title: "Share & Import",
    body: "Bagikan project via link dan salin ke workspace penerima tanpa mengubah project asli.",
    tag: "",
    surfaceColor: "#2269a8",
    tone: "light",
    className: "md:col-span-2",
    height: "min-h-[282px]",
    icon: Link,
  },
  {
    title: "Export Peta",
    body: "Unduh tampilan peta aktif sebagai gambar untuk dokumentasi cepat.",
    tag: "",
    surfaceColor: "#f4eee6",
    tone: "dark",
    className: "md:col-span-3",
    height: "min-h-[318px]",
    icon: Download,
  },
  {
    title: "Drawing Berbasis Tab",
    body: "Pilih tab Rawan Bencana, Segmentasi, atau Titik Mitigasi untuk membuat objek sesuai konteks kerja.",
    tag: "Drawing",
    surfaceColor: "#2f740f",
    tone: "light",
    className: "md:col-span-5",
    height: "min-h-[318px]",
    icon: Pencil,
  },
  {
    title: "Rute Evakuasi",
    body: "Pilih zona rawan dan titik mitigasi, lalu SIGMANTA menampilkan rute tercepat di peta.",
    tag: "",
    surfaceColor: "#eee9df",
    tone: "dark",
    className: "md:col-span-4",
    height: "min-h-[318px]",
    icon: Route,
  },
];

const steps = [
  ["Buat Project", "Beri nama dan deskripsi wilayah pemetaan."],
  ["Buka Workspace", "Masuk ke peta interaktif 2D berbasis Leaflet."],
  ["Gambar Objek", "Gunakan tab Rawan Bencana, Segmentasi, atau Titik Mitigasi."],
  ["Edit & Tinjau", "Perbarui nama, label, kategori, risiko, dan catatan objek yang sudah dibuat."],
  ["Rute & Bagikan", "Tampilkan rute evakuasi atau bagikan salinan project via link."],
];

const projectOutputs = [
  {
    title: "Peta Interaktif",
    body: "Visualisasi wilayah kerja berisi segmentasi lahan, zona rawan bencana, marker fasilitas, dan titik mitigasi.",
    icon: Map,
  },
  {
    title: "Rute Evakuasi",
    body: "Jalur dari zona rawan menuju titik mitigasi dipilih berdasarkan tujuan manual atau estimasi tercepat.",
    icon: Route,
  },
  {
    title: "Rekap Risiko",
    body: "Ringkasan objek, kategori, luas area, level risiko, dan catatan lapangan untuk membantu prioritas mitigasi.",
    icon: TriangleAlert,
  },
];

const targetUsers = [
  "Tim mitigasi bencana",
  "Perencana wilayah",
  "Petugas lapangan",
  "Instansi pemerintah atau kampus",
];

export function EarthVideoHero({ currentUser }: { currentUser?: AuthUser | null }) {
  const primaryHref = currentUser ? "/dashboard" : "/register";
  const primaryLabel = currentUser ? "Buka Dashboard" : "Mulai Pemetaan";

  return (
    <main className="page-enter contour-paper min-h-screen text-[#181713]">
      <nav className="sticky top-0 z-30 border-b-2 border-earth-dark bg-earth-light/88 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1216px] items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-earth-dark text-earth-light">
              <MapPinned size={17} />
            </span>
            <span className="font-display text-2xl font-black">SIGMANTA</span>
          </a>
          <div className="hidden items-center gap-14 text-xs font-bold uppercase tracking-[0.18em] text-earth-dark/55 md:flex">
            <a href="#fitur">Fitur</a>
            <a href="#cara-kerja">Cara Kerja</a>
            <a href="#public-earth">Peta Global</a>
            <a href="#tentang">Tentang</a>
          </div>
          {currentUser ? (
            <a className="brutal-button bg-earth-dark px-7 py-3 text-earth-light" href="/dashboard">
              Dashboard
            </a>
          ) : (
            <div className="flex items-center gap-3">
              <a className="hidden text-xs font-bold uppercase tracking-[0.12em] md:inline" href="/login">
                Masuk
              </a>
              <a className="brutal-button bg-earth-dark px-7 py-3 text-earth-light" href="/register">
                Daftar
              </a>
            </div>
          )}
        </div>
      </nav>

      <section className="relative mx-auto grid min-h-[560px] max-w-[1320px] items-center overflow-visible md:grid-cols-[0.94fr_1.06fr]">
        <div className="relative z-10 px-5 py-12 md:py-16">
          <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-earth-dark/55">
            <span className="h-px w-9 bg-moss" /> Platform WebGIS Mitigasi Bencana
          </span>
          <h1 className="hero-copy-enter font-display mt-8 max-w-3xl text-5xl font-black leading-[1.02] text-earth-dark md:text-7xl">
            <Typewriter />
          </h1>
          <p className="hero-copy-enter-delay font-accent mt-12 max-w-xl text-xl leading-9 text-earth-dark/62">
            Platform pemetaan lahan, identifikasi zona rawan bencana, dan pengelolaan titik mitigasi dalam satu peta interaktif.
          </p>
          <div className="hero-cta-enter mt-9 flex flex-wrap gap-5">
            <a className="brutal-button min-w-60 bg-earth-dark px-7 py-4 text-earth-light" href={primaryHref}>
              {primaryLabel} <ArrowRight size={18} />
            </a>
            <a className="brutal-button min-w-48 bg-earth-light px-7 py-4 text-earth-dark" href="#fitur">
              Lihat Demo
            </a>
          </div>
        </div>

        <div className="hero-globe-float relative flex min-h-[390px] w-full items-center justify-center overflow-visible px-5 md:min-h-[620px]">
          <EarthGlobe3D />
        </div>
      </section>

      <div className="scroll-indicator border-y-2 border-earth-dark py-5 text-center text-xs uppercase tracking-[0.2em] text-earth-dark/50">
        ↓ Jelajahi Fitur
      </div>

      <PublicDatasetEarth />

      <section id="fitur" className="mx-auto max-w-[1216px] px-5 py-16 md:py-20">
        <MotionReveal>
          <p className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-earth-dark/55">
            <span className="h-0.5 w-8 bg-earth-dark" /> Fitur Utama
          </p>
          <h2 className="font-display max-w-2xl text-4xl font-black leading-tight md:text-5xl">Satu Platform. Semua yang Kamu Butuhkan.</h2>
        </MotionReveal>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-stretch">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLightText = feature.tone === "light";
            return (
              <MotionReveal key={feature.title} delay={index * 0.05} className={feature.className}>
                <article
                  className={`brutal-card brutal-card-hover bento-motion relative overflow-hidden p-8 ${feature.height} ${isLightText ? "text-[#f4eee6]" : "text-[#181713]"}`}
                  style={{ backgroundColor: feature.surfaceColor }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <Icon size={38} strokeWidth={1.75} className={isLightText ? "text-[#f4eee6]" : "text-[#181713]"} />
                    {feature.tag ? (
                      <span className={`rounded-sm border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${isLightText ? "border-[#f4eee6]/60 text-[#f4eee6]/80" : "border-[#181713]/60 text-[#181713]/70"}`}>
                        {feature.tag}
                      </span>
                    ) : null}
                  </div>
                  <h3 className={`label-mono mt-9 max-w-xs ${isLightText ? "text-[#f4eee6]" : "text-[#181713]"}`}>{feature.title}</h3>
                  <p className={`mt-4 max-w-xl text-[0.92rem] leading-7 ${isLightText ? "text-[#f4eee6]/80" : "text-[#181713]/70"}`}>{feature.body}</p>
                  {feature.title === "Pemetaan Lahan Interaktif" ? <div className="absolute bottom-8 right-10 h-24 w-44 rotate-[-12deg] border-2 border-[#f4eee6]/28" /> : null}
                </article>
              </MotionReveal>
            );
          })}
        </div>
      </section>

      <section id="cara-kerja" className="border-t-2 border-earth-dark px-5 py-16 md:py-20">
        <div className="mx-auto max-w-[1216px]">
          <MotionReveal>
            <p className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-earth-dark/55">
              <span className="h-0.5 w-8 bg-earth-dark" /> Cara Kerja
            </p>
            <h2 className="font-display text-4xl font-black">Lima Langkah Sederhana</h2>
          </MotionReveal>
          <div className="mt-12 grid gap-8 md:grid-cols-5">
            {steps.map(([step, body], index) => (
              <MotionReveal key={step} delay={index * 0.12}>
                <div className="section-reveal border-l border-earth-dark/15 pl-5" style={{ "--reveal-delay": `${index * 140}ms` } as CSSProperties}>
                  <span className="font-display text-5xl font-black text-earth-dark/10">0{index + 1}</span>
                  <p className="label-mono mt-4">{step}</p>
                  <p className="mt-3 text-sm leading-6 text-earth-dark/55">{body}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="tentang" className="bg-earth-dark px-5 py-16 text-earth-light md:py-20">
        <div className="mx-auto max-w-[1216px]">
          <MotionReveal>
            <p className="mb-5 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-earth-light/55">
              <span className="h-0.5 w-8 bg-moss-light" /> Tentang SIGMANTA
            </p>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="font-display max-w-2xl text-4xl font-black leading-tight md:text-5xl">
                  Sistem informasi geospasial untuk memahami wilayah sebelum mengambil keputusan mitigasi.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-earth-light/70">
                  SIGMANTA membantu pengguna membuat project pemetaan berbasis wilayah. Setiap project dapat berisi batas lahan, zona risiko bencana,
                  fasilitas penting, titik kumpul, posko, dan gudang logistik. Rute evakuasi dapat dihitung dari zona rawan menuju titik mitigasi yang dipilih.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border-2 border-earth-paper bg-earth-light p-5 text-earth-dark">
                  <p className="label-mono text-earth-dark/55">Digunakan Untuk</p>
                  <p className="mt-4 text-sm leading-7 text-earth-dark/75">
                    Menyusun basis data wilayah, melihat sebaran risiko, menandai sumber daya mitigasi, dan membagikan salinan project tanpa mengubah data asli.
                  </p>
                </div>
                <div className="border-2 border-earth-paper bg-moss-light p-5 text-earth-dark">
                  <p className="label-mono text-earth-dark/55">Pengguna Utama</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {targetUsers.map((user) => (
                      <span key={user} className="border border-earth-dark/30 bg-earth-light px-2 py-1 text-[11px] font-bold uppercase">
                        {user}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </MotionReveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {projectOutputs.map((output, index) => {
              const Icon = output.icon;
              return (
                <MotionReveal key={output.title} delay={index * 0.08}>
                  <article className="min-h-[238px] border-2 border-earth-paper bg-earth-mid p-6">
                    <Icon size={34} className="text-moss-light" />
                    <p className="label-mono mt-7 text-earth-light/60">Output {index + 1}</p>
                    <h3 className="font-display mt-3 text-2xl font-black">{output.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-earth-light/68">{output.body}</p>
                  </article>
                </MotionReveal>
              );
            })}
          </div>

          <MotionReveal className="mt-12">
            <div className="flex flex-col items-start justify-between gap-6 border-t-2 border-earth-light/20 pt-8 md:flex-row md:items-center">
              <div>
                <p className="label-mono text-earth-light/50">Nilai Utama</p>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-earth-light/78">
                  Output SIGMANTA dipakai sebagai bahan koordinasi, dokumentasi wilayah, dasar prioritas mitigasi, dan arsip project yang dapat disimpan, diperbarui, atau disalin ke akun lain.
                </p>
              </div>
              <a className="brutal-button shrink-0 border-earth-paper bg-earth-light px-9 py-5 text-earth-dark shadow-[4px_4px_0_rgba(245,240,232,.38)]" href={primaryHref}>
                {currentUser ? "Buka Dashboard" : "Daftar Gratis"} <ArrowRight size={18} />
              </a>
            </div>
          </MotionReveal>
        </div>
      </section>
    </main>
  );
}
