import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ManageUsersPanel } from "@/components/ManageUsersPanel";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ManageUserPage() {
  const user = await getCurrentUserRecord();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/profile");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const safeUsers = users.map(({ password: _, createdAt: __, updatedAt: ___, ...safeUser }) => safeUser);

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar active="settings" projectName={user.name} userEmail={user.email} userInstitution={user.institution} userRole={user.role} avatarUrl={user.avatarUrl} />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="label-mono text-moss">Admin Only</p>
          <h1 className="font-display mt-2 text-4xl font-black">Manage Users</h1>
          <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
            Buat user baru, edit data profil, ubah role admin/user, reset password, dan hapus akun dari satu halaman.
          </p>
          <ManageUsersPanel initialUsers={safeUsers} />
        </div>
      </section>
    </main>
  );
}
