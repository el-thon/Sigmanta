import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectShareDialog } from "@/components/ProjectShareDialog";
import { redirect } from "next/navigation";

export default async function ProjectSharePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  const { id } = await params;
  const project = await prisma.mappingProject.findFirst({
    where: { id: Number(id), ownerId: user.id },
    select: { id: true, name: true, description: true },
  });
  if (!project) redirect("/projects");

  return (
    <main className="page-enter topographic-paper min-h-screen px-6 py-10 text-earth-dark">
      <section className="mx-auto max-w-3xl">
        <a href={`/projects/${project.id}`} className="label-mono text-moss">Kembali ke Detail Project</a>
        <div className="brutal-card mt-6 bg-earth-light p-8">
          <p className="label-mono text-earth-dark/55">Share Project</p>
          <h1 className="font-display mt-3 text-4xl font-black">{project.name}</h1>
          <p className="mt-4 leading-7 text-earth-dark/70">{project.description || "Project ini belum memiliki deskripsi."}</p>
          <div className="mt-8">
            <ProjectShareDialog projectId={project.id} projectName={project.name} buttonClassName="brutal-button bg-earth-dark px-6 py-4 text-earth-light" label="Buat Link Share" />
          </div>
        </div>
      </section>
    </main>
  );
}
