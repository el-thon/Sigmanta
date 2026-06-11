"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.message ?? "Autentikasi gagal.");
      return;
    }

    const nextUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
    router.push(nextUrl || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {mode === "register" ? (
        <label className="block">
          <span className="label-mono">Nama</span>
          <input name="name" required className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" placeholder="Nama lengkap" />
        </label>
      ) : null}

      <label className="block">
        <span className="label-mono">Email</span>
        <input name="email" type="email" required className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" placeholder="nama@instansi.go.id" />
      </label>

      <label className="block">
        <span className="label-mono flex items-center justify-between">
          Kata Sandi
          {mode === "login" ? <a href="#" className="text-moss">Lupa Sandi?</a> : null}
        </span>
        <span className="brutal-card mt-2 flex w-full items-center bg-earth-light">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={mode === "register" ? 6 : 1}
            className="min-w-0 flex-1 bg-transparent px-4 py-4 outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="mr-2 grid h-10 w-10 place-items-center border border-earth-dark/25 bg-earth-paper text-earth-dark transition hover:bg-moss-light"
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error ? <p className="brutal-card border-hazard bg-hazard-light px-4 py-3 text-sm text-earth-dark">{error}</p> : null}

      <button disabled={loading} className="brutal-button w-full bg-moss px-5 py-4 text-earth-light disabled:cursor-not-allowed disabled:opacity-70">
        {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"} <ArrowRight size={17} />
      </button>
    </form>
  );
}
