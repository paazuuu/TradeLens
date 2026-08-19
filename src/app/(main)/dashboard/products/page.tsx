import { fetchOpportunities } from "@/lib/research/data-source";

import { PageHeader } from "../_components/page-header";
import { OpportunityRanking } from "../opportunities/_components/opportunity-ranking";

export default async function Page() {
  const opportunities = await fetchOpportunities();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="products" />
      <OpportunityRanking data={opportunities} />
    </div>
  );
}
