import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ProjectDetailForm } from "@/components/ProjectDetailForm";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Activity, ArrowLeft, Layers, MapPinned, Shapes } from "lucide-react";
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

  const activities = await prisma.activityLog.findMany({
    where: { projectId: project.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <main className="page-enter flex min-h-screen flex-col bg-earth-light text-earth-dark md:flex-row">
      <div>
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

          <div className="brutal-card mt-8 bg-earth-light p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="label-mono text-earth-dark/55">Audit Trail</p>
                <h2 className="font-display mt-2 text-2xl font-black">Recent Activity</h2>
              </div>
              <Activity className="text-moss" />
            </div>
            <div className="mt-5 divide-y-2 divide-earth-dark/10">
              {activities.map((activity) => (
                <div key={activity.id} className="grid gap-2 py-4 md:grid-cols-[180px_1fr]">
                  <div>
                    <p className="text-xs font-bold uppercase text-earth-dark/55">{activity.createdAt.toLocaleString("id-ID")}</p>
                    <p className="mt-1 text-xs text-earth-dark/50">{activity.user.name}</p>
                  </div>
                  <div>
                    <p className="font-bold">{activity.action.replace(/\./g, " ")}</p>
                    <p className="mt-1 text-sm leading-6 text-earth-dark/65">{activity.description || "Aktivitas project tercatat."}</p>
                    {activity.targetType ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.08em] text-earth-dark/45">
                        Target: {activity.targetType}{activity.targetId ? ` #${activity.targetId}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
              {!activities.length ? (
                <div className="py-8 text-sm leading-6 text-earth-dark/60">Belum ada activity log untuk project ini.</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
