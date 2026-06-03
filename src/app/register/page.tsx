import { AuthForm } from "@/components/AuthForm";
import { Map, Radar } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="page-enter topographic-paper grid min-h-screen grid-cols-1 text-earth-dark lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <a href="/" className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center border-2 border-earth-dark bg-earth-paper shadow-[4px_4px_0_#1c1a14]">
              <Map />
            </span>
            <span className="font-display text-3xl font-black">SIGMANTA</span>
          </a>
          <h1 className="font-display mt-12 text-4xl font-black">Daftar SIGMANTA</h1>
          <p className="mt-3 text-earth-dark/70">Buat akun untuk mulai membuat project pemetaan.</p>
          <AuthForm mode="register" />
          <p className="mt-8 text-center text-sm text-earth-dark/70">
            Sudah memiliki akun? <a className="font-bold text-moss" href="/login">Masuk</a>
          </p>
        </div>
      </section>
      <aside className="hidden border-l-2 border-earth-dark/20 p-10 lg:flex lg:items-center">
        <div className="mx-auto max-w-xl">
          <p className="label-mono mb-72 flex items-center gap-2"><Radar size={14} /> Sistem Koordinat Aktif</p>
          <div className="brutal-card bg-earth-light p-10">
            <span className="absolute -ml-12 -mt-12 grid h-8 w-8 place-items-center border-2 border-earth-dark bg-moss text-earth-light">
              <Radar size={18} />
            </span>
            <h2 className="font-display text-5xl font-black leading-tight">Mitigasi dimulai dari data yang bisa dipetakan.</h2>
            <p className="font-accent mt-6 border-l-4 border-moss pl-4 text-xl leading-8 text-earth-dark/70">
              Setiap area, risiko, dan titik sumber daya dapat dikelola dalam satu workspace.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
