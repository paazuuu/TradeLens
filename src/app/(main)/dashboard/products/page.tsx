import { mockOpportunities } from "@/lib/research/mock-data";

import { PageHeader } from "../_components/page-header";
import { OpportunityRanking } from "../opportunities/_components/opportunity-ranking";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="products" />
      <OpportunityRanking data={mockOpportunities} />
    </div>
  );
}
