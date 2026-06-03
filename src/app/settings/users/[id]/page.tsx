import { DashboardSidebar } from "@/components/DashboardSidebar";
import { UserDetailPanel } from "@/components/UserDetailPanel";
import { getCurrentUserRecord } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUserRecord();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "admin") redirect("/profile");

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) redirect("/settings");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          projects: true,
          activityLogs: true,
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/settings");

  const { password: _, _count, activityLogs, ...safeUser } = user;

  return (
    <main className="page-enter flex min-h-screen bg-earth-light text-earth-dark">
      <div className="hidden md:block">
        <DashboardSidebar
          active="settings"
          projectName={currentUser.name}
          userEmail={currentUser.email}
          userInstitution={currentUser.institution}
          userRole={currentUser.role}
          avatarUrl={currentUser.avatarUrl}
        />
      </div>
      <section className="topographic-paper flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <a href="/settings" className="label-mono inline-flex items-center gap-2 text-moss">
            <ArrowLeft size={16} /> Kembali ke Manage Users
          </a>
          <div className="mt-5">
            <p className="label-mono text-moss">Admin Only</p>
            <h1 className="font-display mt-2 text-4xl font-black">Detail User</h1>
            <p className="mt-3 max-w-3xl leading-7 text-earth-dark/70">
              Kelola data akun dan tinjau activity log user yang tercatat dari workflow project pemetaan.
            </p>
          </div>

          <UserDetailPanel
            currentUserId={currentUser.id}
            initialUser={{
              ...safeUser,
              createdAt: safeUser.createdAt.toISOString(),
              updatedAt: safeUser.updatedAt.toISOString(),
              projectCount: _count.projects,
              activityCount: _count.activityLogs,
            }}
            activities={activityLogs.map((activity) => ({
              id: activity.id,
              action: activity.action,
              targetType: activity.targetType,
              targetId: activity.targetId,
              description: activity.description,
              createdAt: activity.createdAt.toISOString(),
              project: activity.project,
            }))}
          />
        </div>
      </section>
    </main>
  );
}
