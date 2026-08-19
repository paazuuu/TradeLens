import {
  getDirectionSplit,
  getMarginDistribution,
  getProfitByProduct,
  getSubCategoryScores,
} from "@/lib/research/analytics";

import { PageHeader } from "../_components/page-header";
import { AnalyticsCharts } from "./_components/analytics-charts";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="analytics" />
      <AnalyticsCharts
        directionSplit={getDirectionSplit()}
        marginDistribution={getMarginDistribution()}
        profitByProduct={getProfitByProduct()}
        subCategoryScores={getSubCategoryScores()}
      />
    </div>
  );
}
