import { fetchAnalytics } from "@/lib/research/data-source";

import { PageHeader } from "../_components/page-header";
import { AnalyticsCharts } from "./_components/analytics-charts";

export default async function Page() {
  const analytics = await fetchAnalytics();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="analytics" />
      <AnalyticsCharts
        directionSplit={analytics.directionSplit}
        marginDistribution={analytics.marginDistribution}
        profitByProduct={analytics.profitByProduct}
        subCategoryScores={analytics.subCategoryScores}
      />
    </div>
  );
}
