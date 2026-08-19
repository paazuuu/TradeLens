import {
  getDashboardKpis,
  getTopByDemand,
  getTopByMargin,
  getTopByPriceGap,
  getTopOpportunities,
  getTopSeasonal,
} from "@/lib/research/dashboard";

import { PageHeader } from "../_components/page-header";
import { CrossBorderKpis } from "./_components/crossborder-kpis";
import { DashboardTopLists } from "./_components/dashboard-top-lists";
import { TopOpportunities } from "./_components/top-opportunities";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="dashboard" />
      <CrossBorderKpis kpis={getDashboardKpis()} />
      <TopOpportunities items={getTopOpportunities()} />
      <DashboardTopLists
        demand={getTopByDemand()}
        margin={getTopByMargin()}
        priceGap={getTopByPriceGap()}
        seasonal={getTopSeasonal()}
      />
    </div>
  );
}
