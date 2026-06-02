export default function CreateProjectPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm text-cyan-300">Project Baru</p>
        <h1 className="mt-2 text-3xl font-bold">Buat Project Pemetaan</h1>
        <p className="mt-2 text-slate-300">Form UI awal. Integrasi submit ke API /api/projects dapat dilanjutkan pada tahap implementasi form client.</p>
        <div className="mt-8 space-y-4">
          <input className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Nama project" />
          <textarea className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Deskripsi project" />
          <input className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Lokasi umum" />
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Center latitude" />
            <input className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Center longitude" />
          </div>
          <button className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Simpan Project</button>
        </div>
      </section>
    </main>
  );
}
