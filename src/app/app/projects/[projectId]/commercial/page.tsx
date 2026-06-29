import { redirect } from "next/navigation";

export default async function CommercialIndexPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/app/projects/${projectId}/commercial/contract`);
}
