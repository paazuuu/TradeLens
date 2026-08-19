import { fetchOpportunities } from "@/lib/research/data-source";

import { PageHeader } from "../_components/page-header";
import { OpportunityRanking } from "./_components/opportunity-ranking";
import { OpportunitySummary } from "./_components/opportunity-summary";

export default async function Page() {
  const opportunities = await fetchOpportunities();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="opportunities" />
      <OpportunitySummary data={opportunities} />
      <OpportunityRanking data={opportunities} />
    </div>
  );
}
