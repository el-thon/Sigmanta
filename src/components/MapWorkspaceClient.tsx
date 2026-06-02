"use client";

import dynamic from "next/dynamic";
import type { MapWorkspaceProps } from "@/components/MapWorkspace";

const MapWorkspace = dynamic(() => import("@/components/MapWorkspace").then((mod) => mod.MapWorkspace), {
  ssr: false,
});

export function MapWorkspaceClient(props: MapWorkspaceProps) {
  return <MapWorkspace {...props} />;
}
