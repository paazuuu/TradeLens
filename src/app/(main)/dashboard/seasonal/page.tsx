import { getSeasonalOpportunities } from "@/lib/research/seasonal";

import { PageHeader } from "../_components/page-header";
import { SeasonalList } from "./_components/seasonal-list";

export default function Page() {
  const items = getSeasonalOpportunities();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="seasonal" />
      <SeasonalList items={items} />
    </div>
  );
}
