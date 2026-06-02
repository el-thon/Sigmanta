"use client";

import { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import { ProjectShareDialog } from "@/components/ProjectShareDialog";

type WorkspaceActionEvent = CustomEvent<{
  type: "export" | "save";
  status: "pending" | "success" | "error";
  message: string;
}>;

export function ProjectMapToolbar({ projectId, projectName }: { projectId: number; projectName: string }) {
  const [busyAction, setBusyAction] = useState<"export" | "save" | null>(null);
  const [message, setMessage] = useState("Last saved: ready");

  useEffect(() => {
    const handleWorkspaceAction = (event: Event) => {
      const { type, status, message: nextMessage } = (event as WorkspaceActionEvent).detail;
      setMessage(nextMessage);
      setBusyAction(status === "pending" ? type : null);
    };

    window.addEventListener("sigmita:workspace-action", handleWorkspaceAction);
    return () => window.removeEventListener("sigmita:workspace-action", handleWorkspaceAction);
  }, []);

  function dispatchWorkspaceCommand(type: "export" | "save") {
    setBusyAction(type);
    setMessage(type === "export" ? "Membuat screenshot peta..." : "Menyimpan view project...");
    window.dispatchEvent(new CustomEvent("sigmita:workspace-command", { detail: { type } }));
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
        disabled={busyAction === "export"}
        onClick={() => dispatchWorkspaceCommand("export")}
        type="button"
      >
        <Download size={16} /> {busyAction === "export" ? "Exporting" : "Export"}
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
