import { getInsights } from "@/lib/insights";
import { InsightsOverview } from "@/components/insights/overview";
import { ProfileCards } from "@/components/insights/profile-cards";
import { CostTable } from "@/components/insights/cost-table";
import { ErrorAnalysis } from "@/components/insights/error-analysis";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const data = getInsights();

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-[hsl(var(--fg-tertiary))] mt-1">
          Live multi-profile dashboard ·{" "}
          {new Date(data.timestamp).toLocaleString("en-US", {
            timeZone: "America/New_York",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <InsightsOverview totals={data.totals} />

      <div className="mt-8">
        <CostTable profiles={data.profiles} totalCost={data.totals.cost} />
      </div>

      <div className="mt-8">
        <ProfileCards profiles={data.profiles} />
      </div>

      <div className="mt-8">
        <ErrorAnalysis profiles={data.profiles} />
      </div>
    </div>
  );
}
