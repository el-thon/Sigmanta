import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertTriangle, Download, FolderOpen, MapPin, Plus, Search, SlidersHorizontal } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MotionReveal } from "@/components/MotionReveal";

export default async function DashboardPage() {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  const projects = await prisma.mappingProject.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar active="dashboard" projectName={user.name} userEmail={user.email} userInstitution={user.institution} userRole={user.role} avatarUrl={user.avatarUrl} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h1 className="font-display text-4xl font-black">Dashboard SIGMANTA</h1>
              <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
                Overview spatial risk assessments, active mapping projects, and structural mitigation zones.
              </p>
            </div>
            <a className="brutal-button bg-earth-light px-5 py-4" href="/projects/create">
              <Plus size={18} /> Buat Project Baru
            </a>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-12">
            <MotionReveal className="md:col-span-3">
              <article className="brutal-card min-h-40 bg-hazard-light p-6">
                <div className="flex justify-between">
                  <span className="border-2 border-hazard px-3 py-1 text-xs font-bold uppercase text-hazard">Critical</span>
                  <AlertTriangle className="text-hazard" />
                </div>
                <p className="font-display mt-6 text-5xl font-black text-hazard">14</p>
                <p className="label-mono mt-2 text-hazard">Zona Risiko Tinggi</p>
              </article>
            </MotionReveal>
            <MotionReveal className="md:col-span-6" delay={0.08}>
              <article className="brutal-card min-h-40 p-6">
                <span className="border-2 border-earth-dark px-3 py-1 text-xs font-bold uppercase">Coverage</span>
                <p className="font-display mt-8 text-5xl font-black">2,450 <span className="text-2xl">Ha</span></p>
                <p className="label-mono mt-2 text-earth-dark/60">Area Terpetakan</p>
              </article>
            </MotionReveal>
            <MotionReveal className="md:col-span-3" delay={0.14}>
              <article className="brutal-card min-h-40 bg-moss-light p-6">
                <div className="flex justify-between">
                  <span className="border-2 border-moss px-3 py-1 text-xs font-bold uppercase text-moss">Active</span>
                  <FolderOpen className="text-moss" />
                </div>
                <p className="font-display mt-6 text-5xl font-black text-moss">{projects.length}</p>
                <p className="label-mono mt-2 text-moss/80">Total Project</p>
              </article>
            </MotionReveal>
            <MotionReveal className="md:col-span-4" delay={0.18}>
              <article className="brutal-card min-h-32 p-6">
                <p className="font-display text-3xl font-black">128</p>
                <p className="label-mono mt-2 text-earth-dark/65">Titik Mitigasi</p>
              </article>
            </MotionReveal>
            <MotionReveal className="md:col-span-8" delay={0.24}>
              <article className="brutal-card flex min-h-32 flex-col justify-between gap-5 p-6 md:flex-row md:items-center">
                <div>
                  <p className="label-mono text-earth-dark/65">Export Terakhir</p>
                  <h2 className="font-display mt-3 text-3xl font-black">Laporan_Banjir_Bandung_Q3.pdf</h2>
                  <p className="mt-2 text-sm text-earth-dark/65">Hari ini, 09:41 AM</p>
                </div>
                <button className="brutal-button bg-earth-light px-5 py-3"><Download size={16} /> Unduh Ulang</button>
              </article>
            </MotionReveal>
          </div>

          <div className="mt-12 flex items-center justify-between border-b-2 border-earth-dark pb-5">
            <h2 className="font-display text-3xl font-black">Daftar Project Aktif</h2>
            <div className="flex gap-2">
              <button className="brutal-button bg-earth-light p-3" aria-label="Filter"><SlidersHorizontal size={18} /></button>
              <a className="brutal-button bg-earth-light p-3" href="/projects" aria-label="Cari"><Search size={18} /></a>
            </div>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            {projects.length ? projects.map((project, index) => (
              <MotionReveal key={project.id} delay={index * 0.06}>
                <a className="brutal-card brutal-card-hover block overflow-hidden bg-earth-light" href={`/projects/${project.id}/map`}>
                  <div className="h-28 border-b-2 border-earth-dark bg-earth-paper [background-image:repeating-linear-gradient(35deg,rgba(28,26,20,.08)_0_1px,transparent_1px_18px)]" />
                  <div className="p-5">
                    <span className="border-2 border-moss bg-moss-light px-3 py-1 text-xs font-bold uppercase text-moss">{project.status}</span>
                    <h3 className="font-display mt-5 text-2xl font-black leading-tight">{project.name}</h3>
                    <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-earth-dark/70">{project.description || "Belum ada deskripsi"}</p>
                    <p className="mt-5 flex items-center gap-2 text-sm text-earth-dark/65"><MapPin size={15} /> {project.locationName || "Lokasi belum diatur"}</p>
                    <span className="brutal-button mt-6 w-full bg-earth-light px-4 py-3">Buka Peta</span>
                  </div>
                </a>
              </MotionReveal>
            )) : (
              <div className="brutal-card col-span-full p-8">
                <h3 className="font-display text-2xl font-black">Belum ada project.</h3>
                <p className="mt-2 text-earth-dark/70">Buat project pertama untuk mulai pemetaan.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
