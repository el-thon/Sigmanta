import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function WorkspaceRedirectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await prisma.mappingProject.findFirst({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (!project) redirect("/projects/create");
  redirect(`/projects/${project.id}/map`);
}
