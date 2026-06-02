import { DashboardSidebar } from "@/components/DashboardSidebar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Database, HardDrive, Map, Shield } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [projectCount, objectCount] = await Promise.all([
    prisma.mappingProject.count({ where: { ownerId: user.id } }),
    prisma.mapObject.count({ where: { project: { ownerId: user.id } } }),
  ]);

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar active="settings" projectName={user.name} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="label-mono text-moss">Workspace Settings</p>
          <h1 className="font-display mt-2 text-4xl font-black">Pengaturan SIGMITA</h1>
          <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
            Ringkasan akun, konfigurasi data, dan preferensi workspace. Database aktif memakai Supabase/Postgres, storage file memakai local storage project.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="brutal-card bg-earth-light p-5">
              <Map className="text-moss" />
              <p className="label-mono mt-4 text-earth-dark/55">Project</p>
              <p className="font-display mt-2 text-4xl font-black">{projectCount}</p>
            </div>
            <div className="brutal-card bg-earth-light p-5">
              <Database className="text-water" />
              <p className="label-mono mt-4 text-earth-dark/55">Map Objects</p>
              <p className="font-display mt-2 text-4xl font-black">{objectCount}</p>
            </div>
            <div className="brutal-card bg-earth-light p-5">
              <Shield className="text-hazard" />
              <p className="label-mono mt-4 text-earth-dark/55">Role</p>
              <p className="font-display mt-2 text-4xl font-black uppercase">{user.role}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="brutal-card bg-earth-light p-6">
              <h2 className="font-display text-2xl font-black">Profil Akun</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="label-mono">Nama</span>
                  <input className="mt-2 w-full border-2 border-earth-dark bg-earth-paper px-4 py-3 outline-none" defaultValue={user.name} readOnly />
                </label>
                <label className="block">
                  <span className="label-mono">Email</span>
                  <input className="mt-2 w-full border-2 border-earth-dark bg-earth-paper px-4 py-3 outline-none" defaultValue={user.email} readOnly />
                </label>
              </div>
            </section>

            <section className="brutal-card bg-earth-light p-6">
              <h2 className="font-display text-2xl font-black">Konfigurasi Data</h2>
              <div className="mt-5 space-y-4 text-sm leading-6">
                <div className="flex items-start gap-3 border-b border-earth-dark/15 pb-4">
                  <Database className="mt-1 shrink-0" size={19} />
                  <div>
                    <p className="font-bold">Database</p>
                    <p className="text-earth-dark/65">Supabase/Postgres melalui Prisma untuk user, project, layer, dan map objects.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <HardDrive className="mt-1 shrink-0" size={19} />
                  <div>
                    <p className="font-bold">Storage</p>
                    <p className="text-earth-dark/65">Local storage di folder upload project untuk file pendukung.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
