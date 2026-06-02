import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MotionReveal } from "@/components/MotionReveal";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Download, MapPin, Plus, Search, Share2 } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await prisma.mappingProject.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar active="projects" projectName={user.name} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h1 className="font-display text-4xl font-black">Project Pemetaan</h1>
              <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
                Kelola dan pantau seluruh area registrasi lahan dan analisis risiko lingkungan dalam grid kerja terpusat.
              </p>
            </div>
            <a className="brutal-button bg-earth-dark px-5 py-4 text-earth-light" href="/projects/create">
              <Plus size={18} /> Buat Project Baru
            </a>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-[1fr_170px_180px_160px]">
            <label className="brutal-card flex items-center gap-3 bg-earth-light px-4 py-3">
              <Search size={19} />
              <input className="w-full bg-transparent outline-none" placeholder="Cari ID Project, Nama, atau Wilayah..." />
            </label>
            <select className="brutal-card bg-earth-light px-4 py-3 font-bold uppercase outline-none">
              <option>Status: Semua</option>
            </select>
            <select className="brutal-card bg-earth-light px-4 py-3 font-bold uppercase outline-none">
              <option>Wilayah: Semua</option>
            </select>
            <input className="brutal-card bg-earth-light px-4 py-3 font-bold uppercase outline-none" placeholder="MM/DD/YYYY" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {projects.map((project, index) => (
              <MotionReveal key={project.id} delay={index * 0.06} className={index === 0 ? "lg:col-span-2" : ""}>
                <article className={`brutal-card brutal-card-hover overflow-hidden bg-earth-light ${index === 0 ? "grid md:grid-cols-[0.9fr_1fr]" : ""}`}>
                  <div className="relative min-h-52 border-b-2 border-earth-dark bg-moss-light md:border-b-0 md:border-r-2 [background-image:linear-gradient(135deg,rgba(24,95,165,.35),rgba(59,109,17,.55)),repeating-linear-gradient(45deg,rgba(28,26,20,.16)_0_1px,transparent_1px_20px)]">
                    <span className="absolute left-4 top-4 border-2 border-earth-dark bg-hazard px-3 py-1 text-xs font-bold uppercase text-earth-light">
                      High Risk
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between gap-3">
                      <span className="border border-earth-dark px-3 py-1 text-xs font-bold uppercase">ID-{String(project.id).padStart(4, "0")}</span>
                      <span className="border-2 border-moss bg-moss-light px-3 py-1 text-xs font-bold uppercase text-moss">{project.status}</span>
                    </div>
                    <h2 className="font-display mt-6 text-3xl font-black leading-tight">{project.name}</h2>
                    <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-earth-dark/70">{project.description || "Belum ada deskripsi project."}</p>
                    <div className="mt-5 grid grid-cols-2 gap-4 border-y border-earth-dark/15 py-4 text-sm">
                      <div>
                        <p className="label-mono text-earth-dark/55">Wilayah</p>
                        <p className="mt-1 font-bold">{project.locationName || "Belum diatur"}</p>
                      </div>
                      <div>
                        <p className="label-mono text-earth-dark/55">Update Terakhir</p>
                        <p className="mt-1 font-bold">{project.updatedAt.toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <a className="brutal-button flex-1 bg-earth-light px-4 py-3" href={`/projects/${project.id}/map`}>Buka Peta</a>
                      <button className="brutal-button bg-earth-light p-3" aria-label="Bagikan"><Share2 size={17} /></button>
                      <button className="brutal-button bg-earth-light p-3" aria-label="Unduh"><Download size={17} /></button>
                    </div>
                  </div>
                </article>
              </MotionReveal>
            ))}
            {!projects.length ? (
              <div className="brutal-card col-span-full p-8">
                <h2 className="font-display text-2xl font-black">Belum ada project.</h2>
                <p className="mt-2 text-earth-dark/70">Buat project baru untuk mengaktifkan daftar pemetaan.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
