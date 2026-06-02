export function EarthVideoHero() {
  const videoUrl = process.env.NEXT_PUBLIC_EARTH_VIDEO_URL || "/videos/earth-hero.mp4";

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-start justify-center px-6">
        <p className="mb-4 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
          Platform WebGIS Pemetaan dan Mitigasi
        </p>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          SIGMITA
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 md:text-xl">
          Platform WebGIS yang mengintegrasikan pemetaan lahan, identifikasi zona rawan bencana,
          dan pengelolaan titik mitigasi dalam satu peta interaktif.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" href="/register">
            Mulai Pemetaan
          </a>
          <a className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10" href="/login">
            Masuk
          </a>
        </div>
      </div>
    </section>
  );
}
