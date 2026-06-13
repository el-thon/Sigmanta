import { DashboardSidebar } from "@/components/DashboardSidebar";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, BarChart3, Download, MapPin } from "lucide-react";
import { redirect } from "next/navigation";

export default async function RiskReportsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  const { project } = await searchParams;
  const projectId = project ? Number(project) : undefined;
  const projects = await prisma.mappingProject.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true },
  });

  const riskObjects = await prisma.mapObject.findMany({
    where: {
      project: { ownerId: user.id },
      ...(projectId ? { projectId } : {}),
      OR: [
        { objectType: "disaster_area" },
        { objectType: "radius_area" },
        { layer: { layerType: "disaster_risk" } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, locationName: true } },
      category: { select: { name: true } },
      riskLevel: { select: { id: true, name: true, color: true, score: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalArea = riskObjects.reduce((sum, item) => sum + Number(item.areaSize ?? 0), 0);
  const highRiskCount = riskObjects.filter((item) => (item.riskLevel?.score ?? 0) >= 4).length;
  const groupedRisk = riskObjects.reduce<Record<string, { count: number; color: string }>>((acc, item) => {
    const name = item.riskLevel?.name ?? "Belum Dinilai";
    acc[name] = acc[name] ?? { count: 0, color: item.riskLevel?.color ?? "#888780" };
    acc[name].count += 1;
    return acc;
  }, {});

  return (
    <main className="page-enter flex min-h-screen flex-col bg-earth-light text-earth-dark md:flex-row">
      <div>
        <DashboardSidebar active="reports" projectName={user.name} userEmail={user.email} userInstitution={user.institution} userRole={user.role} avatarUrl={user.avatarUrl} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="label-mono text-hazard">Risk Reports</p>
              <h1 className="font-display mt-2 text-4xl font-black">Laporan Risiko Bencana</h1>
              <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
                Ringkasan area rawan bencana yang digambar di Map Workspace, termasuk kategori, level risiko, dan luas terdampak.
              </p>
            </div>
            <div className="flex gap-3">
              <a className="brutal-button bg-earth-light px-5 py-4" href={projectId ? `/projects/${projectId}/map` : "/workspace"}>
                <MapPin size={18} /> Buka Peta
              </a>
              <button className="brutal-button bg-earth-dark px-5 py-4 text-earth-light" type="button">
                <Download size={18} /> Export
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="brutal-card bg-earth-light p-5">
              <p className="label-mono text-earth-dark/55">Objek Risiko</p>
              <p className="font-display mt-3 text-4xl font-black">{riskObjects.length}</p>
            </div>
            <div className="brutal-card bg-earth-light p-5">
              <p className="label-mono text-earth-dark/55">High Risk</p>
              <p className="font-display mt-3 text-4xl font-black text-hazard">{highRiskCount}</p>
            </div>
            <div className="brutal-card bg-earth-light p-5">
              <p className="label-mono text-earth-dark/55">Estimasi Luas</p>
              <p className="font-display mt-3 text-4xl font-black">{(totalArea / 10000).toFixed(2)} Ha</p>
            </div>
            <form action="/risk-reports" className="brutal-card bg-earth-light p-5">
              <p className="label-mono text-earth-dark/55">Filter Project</p>
              <select name="project" className="mt-3 w-full border-2 border-earth-dark bg-earth-light px-3 py-2 outline-none" defaultValue={projectId ?? ""}>
                <option value="">Semua Project</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <button className="brutal-button mt-3 w-full bg-earth-light px-3 py-2 text-xs" type="submit">Terapkan</button>
            </form>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="brutal-card bg-earth-light p-5">
              <h2 className="font-display text-2xl font-black">Distribusi Level</h2>
              <div className="mt-5 space-y-3">
                {Object.entries(groupedRisk).map(([name, item]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm font-bold">
                      <span>{name}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-2 h-3 border border-earth-dark bg-earth-paper">
                      <div className="h-full" style={{ width: `${Math.max(12, (item.count / Math.max(1, riskObjects.length)) * 100)}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
                {!riskObjects.length ? <p className="text-sm text-earth-dark/65">Belum ada data risiko.</p> : null}
              </div>
            </div>

            <div className="brutal-card overflow-hidden bg-earth-light">
              <div className="border-b-2 border-earth-dark bg-earth-paper px-5 py-3 text-xs font-bold uppercase tracking-[0.08em]">
                Zona Rawan Bencana
              </div>
              {riskObjects.map((item) => (
                <div key={item.id} className="grid gap-3 border-b border-earth-dark/15 px-5 py-4 text-sm md:grid-cols-[1fr_150px_140px_110px] md:items-center">
                  <div>
                    <p className="flex items-center gap-2 font-bold"><AlertTriangle size={16} /> {item.name}</p>
                    <p className="mt-1 text-earth-dark/55">{item.project.name} · {item.project.locationName || "Lokasi belum diatur"}</p>
                  </div>
                  <span>{item.category?.name || "Tanpa kategori"}</span>
                  <span className="w-fit border border-earth-dark px-2 py-1 text-xs font-bold uppercase" style={{ color: item.riskLevel?.color ?? "#1c1a14" }}>
                    {item.riskLevel?.name || "Belum dinilai"}
                  </span>
                  <a className="brutal-button w-fit bg-earth-light px-3 py-2 text-xs" href={`/projects/${item.project.id}/map`}>
                    Buka
                  </a>
                </div>
              ))}
              {!riskObjects.length ? (
                <div className="p-8">
                  <h2 className="font-display text-2xl font-black">Belum ada zona risiko.</h2>
                  <p className="mt-2 text-earth-dark/70">Gambar Zona Rawan Bencana atau Circle Rawan Bencana di Map Workspace.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
