"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function CreateProjectForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const centerLat = String(form.get("centerLat") ?? "");
    const centerLng = String(form.get("centerLng") ?? "");

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? ""),
        locationName: String(form.get("locationName") ?? ""),
        centerLat: centerLat ? Number(centerLat) : undefined,
        centerLng: centerLng ? Number(centerLng) : undefined,
        defaultZoom: Number(form.get("defaultZoom") ?? 13),
      }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.message ?? "Project gagal dibuat.");
      return;
    }

    router.push(`/projects/${data.project.id}/map`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <label className="block">
        <span className="label-mono">Nama Project</span>
        <input name="name" required minLength={3} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" placeholder="Pemetaan Risiko Banjir" />
      </label>
      <label className="block">
        <span className="label-mono">Deskripsi Project</span>
        <textarea name="description" className="brutal-card mt-2 min-h-32 w-full bg-earth-light px-4 py-4 outline-none" placeholder="Ruang lingkup dan catatan awal project" />
      </label>
      <label className="block">
        <span className="label-mono">Lokasi Umum</span>
        <input name="locationName" className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" placeholder="Bandung, Jawa Barat" />
      </label>
      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="label-mono">Center Latitude</span>
          <input name="centerLat" type="number" step="any" className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" placeholder="-6.9175" />
        </label>
        <label className="block">
          <span className="label-mono">Center Longitude</span>
          <input name="centerLng" type="number" step="any" className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" placeholder="107.6191" />
        </label>
        <label className="block">
          <span className="label-mono">Default Zoom</span>
          <input name="defaultZoom" type="number" min={1} max={20} defaultValue={13} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" />
        </label>
      </div>
      {error ? <p className="brutal-card border-hazard bg-hazard-light px-4 py-3 text-sm">{error}</p> : null}
      <button disabled={loading} className="brutal-button bg-moss px-6 py-4 text-earth-light disabled:cursor-not-allowed disabled:opacity-70">
        {loading ? "Menyimpan..." : "Simpan Project"} <ArrowRight size={18} />
      </button>
    </form>
  );
}
