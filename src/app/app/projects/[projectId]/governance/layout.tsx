import GovernanceNav from "./governance-nav";

interface GovernanceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function GovernanceLayout({
  children,
  params,
}: GovernanceLayoutProps) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col gap-0">
      <GovernanceNav projectId={projectId} />
      <div className="pt-5">{children}</div>
    </div>
  );
}
