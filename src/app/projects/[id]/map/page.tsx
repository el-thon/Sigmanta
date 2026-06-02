import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";

const MapWorkspace = dynamic(() => import("@/components/MapWorkspace").then((mod) => mod.MapWorkspace), {
  ssr: false,
});

export default async function ProjectMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.mappingProject.findUnique({ where: { id: Number(id) } });

  const center: [number, number] = project?.centerLat && project?.centerLng
    ? [Number(project.centerLat), Number(project.centerLng)]
    : [-5.3971, 105.2668];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-6 text-white">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-cyan-300">Workspace Peta</p>
          <h1 className="text-2xl font-bold">{project?.name ?? "Project tidak ditemukan"}</h1>
        </div>
        <a className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10" href="/dashboard">Dashboard</a>
      </div>
      <MapWorkspace center={center} zoom={project?.defaultZoom ?? 13} />
    </main>
  );
}
