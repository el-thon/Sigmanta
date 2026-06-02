import { CreateProjectForm } from "@/components/CreateProjectForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CreateProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="page-enter topographic-paper min-h-screen px-6 py-10 text-earth-dark">
      <section className="mx-auto max-w-3xl">
        <a className="label-mono text-moss" href="/projects">← Kembali ke daftar project</a>
        <div className="brutal-card mt-6 bg-earth-paper p-8">
          <p className="label-mono text-moss">Project Baru</p>
          <h1 className="font-display mt-2 text-4xl font-black">Buat Project Pemetaan</h1>
          <p className="mt-3 max-w-2xl leading-7 text-earth-dark/70">
            Data awal ini akan membentuk workspace peta, layer default, dan activity log project.
          </p>
          <CreateProjectForm />
        </div>
      </section>
    </main>
  );
}
