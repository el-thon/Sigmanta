export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-bold">Daftar SIGMITA</h1>
        <p className="mt-2 text-sm text-slate-300">Buat akun untuk mulai membuat project pemetaan.</p>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Nama" />
          <input className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Email" />
          <input className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" placeholder="Password" type="password" />
          <button className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950">Daftar</button>
        </div>
        <a className="mt-4 block text-center text-sm text-cyan-300" href="/login">Sudah punya akun? Masuk</a>
      </section>
    </main>
  );
}
