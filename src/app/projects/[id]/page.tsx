import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ProjectDetailForm } from "@/components/ProjectDetailForm";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Layers, MapPinned, Shapes } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  const { id } = await params;
  const project = await prisma.mappingProject.findFirst({
    where: { id: Number(id), ownerId: user.id },
    include: { _count: { select: { layers: true, objects: true, shareLinks: true } } },
  });
  if (!project) redirect("/projects");

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar active="projects" projectName={user.name} userEmail={user.email} userInstitution={user.institution} userRole={user.role} avatarUrl={user.avatarUrl} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          <a href="/projects" className="label-mono inline-flex items-center gap-2 text-moss"><ArrowLeft size={16} /> Kembali ke Projects</a>
          <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="label-mono text-earth-dark/55">Project Detail</p>
              <h1 className="font-display mt-2 text-4xl font-black">{project.name}</h1>
            </div>
            <a className="brutal-button bg-earth-dark px-5 py-4 text-earth-light" href={`/projects/${project.id}/map`}>
              <MapPinned size={18} /> Buka Peta
            </a>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="brutal-card bg-earth-light p-5"><Layers /><p className="label-mono mt-3 text-earth-dark/55">Layer</p><p className="font-display text-3xl font-black">{project._count.layers}</p></div>
            <div className="brutal-card bg-earth-light p-5"><Shapes /><p className="label-mono mt-3 text-earth-dark/55">Objek</p><p className="font-display text-3xl font-black">{project._count.objects}</p></div>
            <div className="brutal-card bg-earth-light p-5"><MapPinned /><p className="label-mono mt-3 text-earth-dark/55">Status</p><p className="font-display text-3xl font-black">{project.status}</p></div>
          </div>

          <div className="brutal-card mt-8 bg-earth-light p-6">
            <ProjectDetailForm
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                locationName: project.locationName,
                centerLat: project.centerLat ? Number(project.centerLat) : null,
                centerLng: project.centerLng ? Number(project.centerLng) : null,
                defaultZoom: project.defaultZoom,
                status: project.status,
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
