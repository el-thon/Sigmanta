import { redirect } from "next/navigation";

export default async function ProjectSegmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/land-records?project=${id}`);
}
