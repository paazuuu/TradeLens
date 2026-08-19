import { getMarketComparison, getMarketOverview } from "@/lib/research/markets";

import { PageHeader } from "../_components/page-header";
import { MarketComparisonTable } from "./_components/market-comparison-table";
import { MarketOverview } from "./_components/market-overview";

export default function Page() {
  const overview = getMarketOverview();
  const rows = getMarketComparison();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="markets" />
      <MarketOverview overview={overview} />
      <MarketComparisonTable rows={rows} />
    </div>
  );
}
