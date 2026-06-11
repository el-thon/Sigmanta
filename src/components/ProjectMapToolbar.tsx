"use client";

import { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { ProjectShareDialog } from "@/components/ProjectShareDialog";

type WorkspaceActionEvent = CustomEvent<{
  type: "pdf" | "save";
  status: "pending" | "success" | "error";
  message: string;
}>;

export function ProjectMapToolbar({ projectId, projectName }: { projectId: number; projectName: string }) {
  const [busyAction, setBusyAction] = useState<"pdf" | "geojson" | "save" | null>(null);
  const [message, setMessage] = useState("Last saved: ready");

  useEffect(() => {
    const handleWorkspaceAction = (event: Event) => {
      const { type, status, message: nextMessage } = (event as WorkspaceActionEvent).detail;
      setMessage(nextMessage);
      setBusyAction(status === "pending" ? type : null);
    };

    window.addEventListener("sigmanta:workspace-action", handleWorkspaceAction);
    return () => window.removeEventListener("sigmanta:workspace-action", handleWorkspaceAction);
  }, []);

  function dispatchWorkspaceCommand(type: "pdf" | "save") {
    setBusyAction(type);
    setMessage(type === "pdf" ? "Membuat PDF peta..." : "Menyimpan view project...");
    window.dispatchEvent(new CustomEvent("sigmanta:workspace-command", { detail: { type } }));
  }

  async function exportGeoJson() {
    setBusyAction("geojson");
    setMessage("Membuat GeoJSON...");
    const response = await fetch(`/api/projects/${projectId}/export`, { method: "POST" });
    if (!response.ok) {
      setMessage("Export GeoJSON gagal.");
      setBusyAction(null);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sigmanta-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.geojson`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("GeoJSON berhasil didownload.");
    setBusyAction(null);
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <p className="text-right text-xs">
        Status: <span className="font-bold text-moss">Online</span>
        <br />
        <span className="text-earth-dark/55">{message}</span>
      </p>
      <ProjectShareDialog
        projectId={projectId}
        projectName={projectName}
        buttonClassName="brutal-button bg-earth-light px-4 py-3"
        label="Share"
        iconSize={16}
      />
      <button
        className="brutal-button bg-earth-light px-4 py-3 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={busyAction === "pdf"}
        onClick={() => dispatchWorkspaceCommand("pdf")}
        type="button"
      >
        <Download size={16} /> {busyAction === "pdf" ? "Exporting" : "PDF"}
      </button>
      <button
        className="brutal-button bg-earth-light px-4 py-3 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={busyAction === "geojson"}
        onClick={exportGeoJson}
        type="button"
      >
        <Download size={16} /> {busyAction === "geojson" ? "Exporting" : "GeoJSON"}
      </button>
      <button
        className="brutal-button bg-earth-dark px-4 py-3 text-earth-light disabled:cursor-not-allowed disabled:opacity-65"
        disabled={busyAction === "save"}
        onClick={() => dispatchWorkspaceCommand("save")}
        type="button"
      >
        <Save size={16} /> {busyAction === "save" ? "Saving" : "Save"}
      </button>
    </div>
  );
}
