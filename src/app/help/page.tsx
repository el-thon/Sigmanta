import { DashboardSidebar } from "@/components/DashboardSidebar";
import { getCurrentUserRecord } from "@/lib/auth";
import { CircleHelp, Hexagon, MapPin, Search, Square } from "lucide-react";
import { redirect } from "next/navigation";

const guides = [
  { title: "Buat Project", body: "Masuk ke New Analysis, isi nama project, lokasi, koordinat center, lalu sistem akan membuka Map Workspace." },
  { title: "Segmentasi Lahan", body: "Pilih tool Segmentasi Lahan atau Blok Lahan, atau ambil batas wilayah OSM untuk membuat polygon mengikuti bentuk wilayah." },
  { title: "Zona Rawan Bencana", body: "Pilih Zona Rawan Bencana atau Circle Rawan Bencana, pilih tingkat risiko, lalu simpan untuk muncul di Risk Reports." },
  { title: "Titik Mitigasi", body: "Gunakan Titik Mitigasi untuk posko/titik kumpul. Saat zona rawan dipilih, sistem menghitung rute tercepat ke titik mitigasi." },
];

export default async function HelpPage() {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar active="help" projectName={user.name} userEmail={user.email} userInstitution={user.institution} userRole={user.role} avatarUrl={user.avatarUrl} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="label-mono text-moss">Help Center</p>
          <h1 className="font-display mt-2 text-4xl font-black">Panduan Penggunaan</h1>
          <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
            Alur utama SIGMANTA adalah membuat project, menggambar objek geospasial, mengisi detail objek, lalu memakai data tersebut untuk land records dan risk reports.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {guides.map((guide, index) => (
              <article key={guide.title} className="brutal-card bg-earth-light p-6">
                <span className="label-mono text-earth-dark/45">0{index + 1}</span>
                <h2 className="font-display mt-3 text-2xl font-black">{guide.title}</h2>
                <p className="mt-3 text-sm leading-6 text-earth-dark/68">{guide.body}</p>
              </article>
            ))}
          </div>

          <section className="brutal-card mt-8 bg-earth-light p-6">
            <h2 className="font-display text-2xl font-black">Tool Workspace</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-5">
              {[
                { label: "Polygon", icon: Hexagon },
                { label: "Rectangle", icon: Square },
                { label: "Circle", icon: CircleHelp },
                { label: "Marker", icon: MapPin },
                { label: "Boundary", icon: Search },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="border-2 border-earth-dark bg-earth-paper p-4 text-center">
                    <Icon className="mx-auto" />
                    <p className="label-mono mt-3">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
