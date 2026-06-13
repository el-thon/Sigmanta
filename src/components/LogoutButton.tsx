"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }

    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <button
      className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.06em] text-earth-dark/70"
      onClick={handleLogout}
      type="button"
    >
      <LogOut size={18} /> Log Out
    </button>
  );
}
