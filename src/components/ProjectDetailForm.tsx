"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";

type ProjectDetail = {
  id: number;
  name: string;
  description: string | null;
  locationName: string | null;
  centerLat: unknown;
  centerLng: unknown;
  defaultZoom: number;
  status: "draft" | "active" | "archived" | "imported";
};

export function ProjectDetailForm({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const centerLat = String(form.get("centerLat") ?? "");
    const centerLng = String(form.get("centerLng") ?? "");

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        description: String(form.get("description") ?? "") || null,
        locationName: String(form.get("locationName") ?? "") || null,
        centerLat: centerLat ? Number(centerLat) : null,
        centerLng: centerLng ? Number(centerLng) : null,
        defaultZoom: Number(form.get("defaultZoom") ?? 13),
        status: String(form.get("status") ?? project.status),
      }),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) {
      setError(data?.message ?? "Project gagal diperbarui.");
      return;
    }
    router.refresh();
  }

  async function deleteProject() {
    if (!window.confirm("Hapus project ini beserta semua objek petanya?")) return;
    setDeleting(true);
    const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    setDeleting(false);
    if (!response.ok) {
      setError(data?.message ?? "Project gagal dihapus.");
      return;
    }
    router.push("/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="label-mono">Nama Project</span>
        <input name="name" required minLength={3} defaultValue={project.name} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" />
      </label>
      <label className="block">
        <span className="label-mono">Deskripsi</span>
        <textarea name="description" defaultValue={project.description ?? ""} className="brutal-card mt-2 min-h-28 w-full bg-earth-light px-4 py-4 outline-none" />
      </label>
      <label className="block">
        <span className="label-mono">Lokasi Umum</span>
        <input name="locationName" defaultValue={project.locationName ?? ""} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" />
      </label>
      <div className="grid gap-5 md:grid-cols-4">
        <label className="block">
          <span className="label-mono">Center Lat</span>
          <input name="centerLat" type="number" step="any" defaultValue={project.centerLat === null ? "" : String(project.centerLat)} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" />
        </label>
        <label className="block">
          <span className="label-mono">Center Lng</span>
          <input name="centerLng" type="number" step="any" defaultValue={project.centerLng === null ? "" : String(project.centerLng)} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" />
        </label>
        <label className="block">
          <span className="label-mono">Zoom</span>
          <input name="defaultZoom" type="number" min={1} max={20} defaultValue={project.defaultZoom} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none" />
        </label>
        <label className="block">
          <span className="label-mono">Status</span>
          <select name="status" defaultValue={project.status} className="brutal-card mt-2 w-full bg-earth-light px-4 py-4 outline-none">
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
            <option value="imported">imported</option>
          </select>
        </label>
      </div>
      {error ? <p className="brutal-card border-hazard bg-hazard-light px-4 py-3 text-sm text-hazard">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button className="brutal-button bg-earth-dark px-5 py-4 text-earth-light" disabled={loading} type="submit">
          <Save size={17} /> {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button className="brutal-button bg-hazard px-5 py-4 text-earth-light" disabled={deleting} onClick={deleteProject} type="button">
          <Trash2 size={17} /> {deleting ? "Menghapus..." : "Hapus Project"}
        </button>
      </div>
    </form>
  );
}
