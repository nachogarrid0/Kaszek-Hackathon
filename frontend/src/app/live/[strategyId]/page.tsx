import { LiveLayout } from "@/components/live/LiveLayout";

interface LivePageProps {
  params: Promise<{ strategyId: string }>;
  searchParams: Promise<{ scenario?: string }>;
}

export default async function LivePage({ searchParams }: LivePageProps) {
  const { scenario } = await searchParams;
  const validScenario = ["bull", "rotation", "defensive"].includes(scenario ?? "")
    ? (scenario as "bull" | "rotation" | "defensive")
    : "bull";

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <LiveLayout scenario={validScenario} />
    </div>
  );
}
