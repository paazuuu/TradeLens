import { mockOpportunities } from "@/lib/research/mock-data";

import { PageHeader } from "../_components/page-header";
import { OpportunityRanking } from "./_components/opportunity-ranking";
import { OpportunitySummary } from "./_components/opportunity-summary";

export default function Page() {
  const opportunities = mockOpportunities;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="opportunities" />
      <OpportunitySummary data={opportunities} />
      <OpportunityRanking data={opportunities} />
    </div>
  );
}
