import { prisma } from "@/lib/prisma";
import { ArrowLeft, Download, Save, Share2 } from "lucide-react";
import { MapWorkspaceClient } from "@/components/MapWorkspaceClient";

export default async function ProjectMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.mappingProject.findUnique({ where: { id: Number(id) } });

  const center: [number, number] = project?.centerLat && project?.centerLng
    ? [Number(project.centerLat), Number(project.centerLng)]
    : [-5.3971, 105.2668];

  return (
    <main className="page-enter min-h-screen bg-earth-light text-earth-dark">
      <header className="topographic-paper flex h-[66px] items-center justify-between border-b-2 border-earth-dark px-5">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="font-display flex items-center gap-2 text-2xl font-black">
            <ArrowLeft size={20} /> SIGMITA GIS
          </a>
          <nav className="hidden items-center gap-8 text-sm text-earth-dark/75 md:flex">
            <a href="/dashboard">Global Risks</a>
            <a href="/projects">Land Registry</a>
            <a href="#">Methodology</a>
            <a href="/">About</a>
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <p className="text-right text-xs">
            Status: <span className="font-bold text-moss">Online</span><br />
            <span className="text-earth-dark/55">Last saved: 2m ago</span>
          </p>
          <button className="brutal-button bg-earth-light px-4 py-3"><Share2 size={16} /> Share</button>
          <button className="brutal-button bg-earth-light px-4 py-3"><Download size={16} /> Export</button>
          <button className="brutal-button bg-earth-dark px-4 py-3 text-earth-light"><Save size={16} /> Save</button>
        </div>
      </header>
      <MapWorkspaceClient center={center} zoom={project?.defaultZoom ?? 13} />
    </main>
  );
}
