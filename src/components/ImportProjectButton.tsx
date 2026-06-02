"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyPlus } from "lucide-react";

export function ImportProjectButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function importProject() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/share/${token}/import`, { method: "POST" });
    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.message ?? "Project gagal disalin.");
      return;
    }

    router.push(`/projects/${data.project.id}/map`);
    router.refresh();
  }

  return (
    <div>
      {error ? <p className="mb-3 border-2 border-hazard bg-hazard-light px-4 py-3 text-sm text-hazard">{error}</p> : null}
      <button className="brutal-button bg-earth-dark px-6 py-4 text-earth-light" onClick={importProject} disabled={loading} type="button">
        <CopyPlus size={18} /> {loading ? "Menyalin..." : "Salin ke Workspace Saya"}
      </button>
    </div>
  );
}
