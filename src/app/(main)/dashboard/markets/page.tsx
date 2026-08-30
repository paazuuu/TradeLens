import { fetchKeywordGaps, fetchMarkets } from "@/lib/research/data-source";

import { PageHeader } from "../_components/page-header";
import { KeywordGaps } from "./_components/keyword-gaps";
import { MarketComparisonTable } from "./_components/market-comparison-table";
import { MarketOverview } from "./_components/market-overview";

export default async function Page() {
  const [{ overview, comparison }, keywordGaps] = await Promise.all([fetchMarkets(), fetchKeywordGaps()]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="markets" />
      <MarketOverview overview={overview} />
      <MarketComparisonTable rows={comparison} />
      <KeywordGaps gaps={keywordGaps} />
    </div>
  );
}
