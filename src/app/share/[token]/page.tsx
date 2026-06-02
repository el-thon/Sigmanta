import { ImportProjectButton } from "@/components/ImportProjectButton";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Layers, MapPinned, Shapes } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SharePreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  const { token } = await params;
  const shareLink = await prisma.projectShareLink.findUnique({
    where: { token },
    include: {
      creator: { select: { name: true, institution: true } },
      project: {
        include: {
          _count: { select: { layers: true, objects: true } },
        },
      },
    },
  });

  if (!shareLink || !shareLink.isActive || (shareLink.expiresAt && shareLink.expiresAt < new Date())) {
    redirect("/projects");
  }

  return (
    <main className="page-enter topographic-paper min-h-screen px-6 py-10 text-earth-dark">
      <section className="mx-auto max-w-5xl">
        <a href="/projects" className="label-mono inline-flex items-center gap-2 text-moss">
          <ArrowLeft size={16} /> Kembali ke My Workspace
        </a>

        <div className="brutal-card mt-6 grid overflow-hidden bg-earth-light lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-h-80 border-b-2 border-earth-dark bg-moss-light p-8 lg:border-b-0 lg:border-r-2">
            <span className="inline-flex border-2 border-earth-dark bg-hazard px-3 py-1 text-xs font-bold uppercase text-earth-light">
              Shared Project
            </span>
            <div className="mt-24 grid h-28 w-28 place-items-center border-2 border-earth-dark bg-earth-light shadow-[6px_6px_0_#1c1a14]">
              <MapPinned size={42} />
            </div>
          </div>

          <div className="p-8">
            <p className="label-mono text-earth-dark/55">Dibagikan oleh {shareLink.creator.name}</p>
            <h1 className="font-display mt-4 text-4xl font-black leading-tight">{shareLink.project.name}</h1>
            <p className="mt-4 leading-7 text-earth-dark/70">{shareLink.project.description || "Project ini belum memiliki deskripsi."}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="border-2 border-earth-dark bg-earth-paper p-4">
                <Layers />
                <p className="label-mono mt-3 text-earth-dark/55">Layer</p>
                <p className="font-display text-3xl font-black">{shareLink.project._count.layers}</p>
              </div>
              <div className="border-2 border-earth-dark bg-earth-paper p-4">
                <Shapes />
                <p className="label-mono mt-3 text-earth-dark/55">Objek</p>
                <p className="font-display text-3xl font-black">{shareLink.project._count.objects}</p>
              </div>
              <div className="border-2 border-earth-dark bg-earth-paper p-4">
                <MapPinned />
                <p className="label-mono mt-3 text-earth-dark/55">Wilayah</p>
                <p className="mt-1 text-sm font-bold">{shareLink.project.locationName || "Belum diatur"}</p>
              </div>
            </div>

            <div className="mt-8 border-t-2 border-earth-dark pt-6">
              <p className="mb-4 text-sm leading-6 text-earth-dark/70">
                Project akan disalin menjadi project baru milik akun kamu. Perubahan setelah disalin tidak realtime dan tidak mengubah project sumber.
              </p>
              <ImportProjectButton token={token} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
