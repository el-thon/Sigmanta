import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await prisma.mappingProject.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300">Dashboard</p>
            <h1 className="text-3xl font-bold">Project Pemetaan Saya</h1>
          </div>
          <a className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950" href="/projects/create">Buat Project</a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">Total Project</p>
            <p className="mt-2 text-4xl font-bold">{projects.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">Mode Share</p>
            <p className="mt-2 text-lg font-semibold">Import ke personal project</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">Stack Peta</p>
            <p className="mt-2 text-lg font-semibold">Leaflet + PostGIS</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <a key={project.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10" href={`/projects/${project.id}/map`}>
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="mt-2 text-sm text-slate-300">{project.description || "Belum ada deskripsi"}</p>
              <p className="mt-4 text-xs text-slate-400">{project.locationName || "Lokasi belum diatur"}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
