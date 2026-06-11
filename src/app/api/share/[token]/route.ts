import { prisma } from "@/lib/prisma";
import { errorResponse, success } from "@/lib/response";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const shareLink = await prisma.projectShareLink.findUnique({
    where: { token },
    include: {
      creator: { select: { name: true, institution: true } },
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          locationName: true,
          updatedAt: true,
          _count: { select: { layers: true, objects: true } },
        },
      },
    },
  });

  if (!shareLink || !shareLink.isActive || (shareLink.expiresAt && shareLink.expiresAt < new Date())) {
    return errorResponse("Link share tidak aktif", 404);
  }

  return success({
    token,
    creator: shareLink.creator,
    project: shareLink.project,
  });
}
