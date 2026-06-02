import { DashboardSidebar } from "@/components/DashboardSidebar";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Download, MapPin, Ruler, Search } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LandRecordsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  const { project } = await searchParams;
  const projectId = project ? Number(project) : undefined;
  const projects = await prisma.mappingProject.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true },
  });

  const records = await prisma.mapObject.findMany({
    where: {
      project: { ownerId: user.id },
      ...(projectId ? { projectId } : {}),
      OR: [
        { objectType: "land_segment" },
        { layer: { layerType: "land_segmentation" } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, locationName: true } },
      category: { select: { name: true, color: true } },
      layer: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar active="records" projectName={user.name} userEmail={user.email} userInstitution={user.institution} userRole={user.role} avatarUrl={user.avatarUrl} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="label-mono text-moss">Land Registry</p>
              <h1 className="font-display mt-2 text-4xl font-black">Land Records</h1>
              <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
                Daftar objek segmentasi lahan yang dibuat dari Map Workspace dan tersimpan di database.
              </p>
            </div>
            <a className="brutal-button bg-earth-dark px-5 py-4 text-earth-light" href="/workspace">
              <MapPin size={18} /> Buka Workspace
            </a>
          </div>

          <form action="/land-records" className="mt-8 grid gap-4 md:grid-cols-[1fr_260px_120px_150px]">
            <label className="brutal-card flex items-center gap-3 bg-earth-light px-4 py-3">
              <Search size={18} />
              <input className="w-full bg-transparent outline-none" placeholder="Cari nama lahan, kategori, atau wilayah..." />
            </label>
            <select name="project" className="brutal-card bg-earth-light px-4 py-3 outline-none" defaultValue={projectId ?? ""}>
              <option value="">Semua Project</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <button className="brutal-button bg-earth-light px-4 py-3 text-xs" type="submit">Terapkan</button>
            <button className="brutal-button bg-earth-light px-4 py-3" type="button">
              <Download size={17} /> Export
            </button>
          </form>

          <div className="mt-8 overflow-hidden brutal-card bg-earth-light">
            <div className="grid border-b-2 border-earth-dark bg-earth-paper px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] md:grid-cols-[1.2fr_1fr_140px_150px_130px]">
              <span>Objek Lahan</span>
              <span>Project</span>
              <span>Kategori</span>
              <span>Luas</span>
              <span>Aksi</span>
            </div>
            {records.map((record) => (
              <div key={record.id} className="grid gap-3 border-b border-earth-dark/15 px-5 py-4 text-sm md:grid-cols-[1.2fr_1fr_140px_150px_130px] md:items-center">
                <div>
                  <p className="font-bold">{record.name}</p>
                  <p className="mt-1 text-earth-dark/55">{record.label || record.layer.name}</p>
                </div>
                <div>
                  <p className="font-bold">{record.project.name}</p>
                  <p className="mt-1 text-earth-dark/55">{record.project.locationName || "Lokasi belum diatur"}</p>
                </div>
                <span className="w-fit border border-earth-dark px-2 py-1 text-xs font-bold uppercase">
                  {record.category?.name || "Tanpa kategori"}
                </span>
                <span className="flex items-center gap-2 font-bold">
                  <Ruler size={16} /> {record.areaSize ? `${(Number(record.areaSize) / 10000).toFixed(2)} Ha` : "-"}
                </span>
                <a className="brutal-button w-fit bg-earth-light px-3 py-2 text-xs" href={`/projects/${record.project.id}/map`}>
                  Buka Peta
                </a>
              </div>
            ))}
            {!records.length ? (
              <div className="p-8">
                <h2 className="font-display text-2xl font-black">Belum ada land record.</h2>
                <p className="mt-2 text-earth-dark/70">Buka Map Workspace, pilih Segmentasi Lahan atau Blok Lahan, lalu simpan objeknya.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
