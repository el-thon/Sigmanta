import { ArrowRight, Database, Layers, Map, Radar, Route, Share2, ShieldAlert } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import { Typewriter } from "@/components/Typewriter";

const features = [
  {
    title: "Pemetaan Lahan Interaktif",
    body: "Digitasi area kerja dengan polygon, rectangle, circle, marker, dan polyline.",
    accent: "bg-moss-light",
    className: "md:col-span-8",
    icon: Map,
  },
  {
    title: "Zona Bencana",
    body: "Tandai risiko banjir, longsor, kebakaran, hingga tsunami.",
    accent: "bg-hazard-light",
    className: "md:col-span-4",
    icon: ShieldAlert,
  },
  {
    title: "Share Project",
    body: "Bagikan link untuk import salinan project ke akun penerima.",
    accent: "bg-water-light",
    className: "md:col-span-4",
    icon: Share2,
  },
  {
    title: "Export GeoJSON",
    body: "Keluarkan data spasial untuk analisis lanjutan dan laporan.",
    accent: "bg-earth-paper",
    className: "md:col-span-3",
    icon: Database,
  },
  {
    title: "Digitasi Multi-Bentuk",
    body: "Simpan geometri dan metadata fleksibel berbasis JSON.",
    accent: "bg-earth-paper",
    className: "md:col-span-6",
    icon: Layers,
  },
  {
    title: "Titik Mitigasi",
    body: "Kelola posko, titik kumpul, logistik, fasilitas kesehatan, dan jalur evakuasi.",
    accent: "bg-moss-light",
    className: "md:col-span-3",
    icon: Radar,
  },
];

const steps = ["Buat Project", "Buka Workspace Peta", "Gambar & Segmentasi", "Tambahkan Metadata", "Export & Bagikan"];

export function EarthVideoHero() {
  return (
    <main className="page-enter topographic-paper min-h-screen text-earth-dark">
      <nav className="glass-accent sticky top-0 z-30 border-b border-earth-dark/15 px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center border-2 border-earth-dark bg-earth-paper shadow-[3px_3px_0_#1c1a14]">
              <Map size={16} />
            </span>
            <span className="font-display text-2xl font-black">SIGMITA</span>
          </a>
          <div className="hidden items-center gap-8 text-sm md:flex">
            <a href="#fitur">Fitur</a>
            <a href="#cara-kerja">Cara Kerja</a>
            <a href="#tentang">Tentang</a>
          </div>
          <div className="flex items-center gap-3">
            <a className="hidden text-sm font-semibold uppercase md:inline" href="/login">
              Masuk
            </a>
            <a className="brutal-button bg-earth-dark px-4 py-3 text-earth-light" href="/register">
              Daftar
            </a>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100dvh-76px)] max-w-7xl items-center gap-10 px-5 py-12 md:grid-cols-[1fr_0.95fr]">
        <div className="relative z-10">
          <span className="brutal-card inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.08em]">
            <Route size={14} /> Platform WebGIS Terdepan
          </span>
          <div className="mt-10 h-16 border-l-2 border-earth-dark" />
          <h1 className="font-display max-w-3xl text-5xl font-black leading-[1.02] text-earth-dark md:text-7xl">
            <Typewriter />
          </h1>
          <p className="font-accent mt-6 max-w-2xl text-xl leading-8 text-earth-dark/70">
            Platform WebGIS untuk pemetaan lahan, identifikasi zona rawan bencana, dan pengelolaan titik mitigasi.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a className="brutal-button bg-moss px-6 py-4 text-earth-light" href="/register">
              Mulai Pemetaan <ArrowRight size={18} />
            </a>
            <a className="brutal-button bg-earth-light px-6 py-4" href="#fitur">
              Lihat Demo
            </a>
          </div>
        </div>

        <div className="brutal-card relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden bg-[#dfddd5]">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(28,26,20,.18)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-[18px] border-earth-dark/55">
            <div className="absolute inset-6 rounded-full bg-moss-light/55" style={{ animation: "slow-spin 40s linear infinite" }}>
              <span className="absolute left-8 top-8 h-16 w-28 rounded-[40%] bg-earth-dark/45" />
              <span className="absolute bottom-8 right-6 h-20 w-24 rounded-[45%] bg-earth-dark/45" />
              <span className="absolute bottom-14 left-9 h-14 w-14 rounded-[35%] bg-earth-dark/45" />
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-earth-dark/20 py-4 text-center text-xs uppercase tracking-[0.08em]" style={{ animation: "float-y 2.4s ease-in-out infinite" }}>
        Scroll untuk jelajahi
      </div>

      <section id="fitur" className="mx-auto max-w-7xl px-5 py-20">
        <MotionReveal>
          <h2 className="font-display max-w-2xl text-5xl font-black leading-tight">Satu Platform. Semua yang Kamu Butuhkan.</h2>
        </MotionReveal>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <MotionReveal key={feature.title} delay={index * 0.05} className={feature.className}>
                <article className={`brutal-card brutal-card-hover min-h-44 p-6 ${feature.accent}`}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="label-mono max-w-xs">{feature.title}</h3>
                    <Icon size={42} strokeWidth={1.7} />
                  </div>
                  <p className="mt-8 max-w-xl leading-7 text-earth-dark/70">{feature.body}</p>
                </article>
              </MotionReveal>
            );
          })}
        </div>
      </section>

      <section id="cara-kerja" className="mx-auto max-w-7xl px-5 py-20">
        <MotionReveal>
          <h2 className="font-display text-4xl font-black">Cara Kerja</h2>
        </MotionReveal>
        <div className="mt-10 grid gap-5 md:grid-cols-5">
          {steps.map((step, index) => (
            <MotionReveal key={step} delay={index * 0.12}>
              <div className="brutal-card min-h-36 p-5">
                <span className="label-mono text-moss">0{index + 1}</span>
                <p className="font-display mt-6 text-2xl font-black leading-tight">{step}</p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section id="tentang" className="bg-earth-dark px-5 py-20 text-earth-light">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="font-display max-w-3xl text-5xl font-black leading-tight">Mulai pemetaan wilayahmu hari ini.</h2>
          <a className="brutal-button border-earth-light bg-moss px-7 py-4 text-earth-light shadow-[4px_4px_0_rgba(245,240,232,.7)]" href="/register">
            Buat Project <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </main>
  );
}
