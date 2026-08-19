import { mockOpportunities } from "@/lib/research/mock-data";

import { OpportunityRanking } from "./_components/opportunity-ranking";
import { OpportunitySummary } from "./_components/opportunity-summary";

export default function Page() {
  const opportunities = mockOpportunities;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Opportunities</h1>
        <p className="text-muted-foreground text-sm">
          Opportunity Score 順の有望商品ランキング。価格差だけでなく総コストベースの推定利益と商流方向で評価する。
        </p>
      </div>

      <OpportunitySummary data={opportunities} />
      <OpportunityRanking data={opportunities} />
    </div>
  );
}
