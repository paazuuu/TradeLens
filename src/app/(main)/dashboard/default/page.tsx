import { fetchDashboard } from "@/lib/research/data-source";

import { PageHeader } from "../_components/page-header";
import { CrossBorderKpis } from "./_components/crossborder-kpis";
import { DashboardTopLists } from "./_components/dashboard-top-lists";
import { TopOpportunities } from "./_components/top-opportunities";

export default async function Page() {
  const dashboard = await fetchDashboard();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="dashboard" />
      <CrossBorderKpis kpis={dashboard.kpis} />
      <TopOpportunities items={dashboard.topOpportunities} />
      <DashboardTopLists
        demand={dashboard.topDemand}
        margin={dashboard.topMargin}
        priceGap={dashboard.topPriceGap}
        seasonal={dashboard.topSeasonal}
      />
    </div>
  );
}
