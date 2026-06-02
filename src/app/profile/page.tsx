import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ProfileForm } from "@/components/ProfileForm";
import { getCurrentUserRecord } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");

  return (
    <main className="page-enter flex min-h-screen flex-col bg-earth-light text-earth-dark md:flex-row">
      <DashboardSidebar active="profile" projectName={user.name} userEmail={user.email} userInstitution={user.institution} userRole={user.role} avatarUrl={user.avatarUrl} />
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="label-mono text-moss">User Profile</p>
          <h1 className="font-display mt-2 text-4xl font-black">Lengkapi Profile</h1>
          <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
            Data profil digunakan untuk identitas pemilik project, pelacakan aktivitas, dan konteks kolaborasi pemetaan.
          </p>
          <ProfileForm user={user} />
        </div>
      </section>
    </main>
  );
}
