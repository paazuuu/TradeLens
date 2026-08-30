import { fetchAnalytics, fetchBrandAnalysis } from "@/lib/research/data-source";

import { PageHeader } from "../_components/page-header";
import { AnalyticsCharts } from "./_components/analytics-charts";
import { BrandAnalysis } from "./_components/brand-analysis";

export default async function Page() {
  const [analytics, brands] = await Promise.all([fetchAnalytics(), fetchBrandAnalysis()]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="analytics" />
      <AnalyticsCharts
        directionSplit={analytics.directionSplit}
        marginDistribution={analytics.marginDistribution}
        profitByProduct={analytics.profitByProduct}
        subCategoryScores={analytics.subCategoryScores}
      />
      <BrandAnalysis brands={brands} />
    </div>
  );
}
