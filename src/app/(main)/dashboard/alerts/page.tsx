import { getAlerts } from "@/lib/research/alerts";

import { PageHeader } from "../_components/page-header";
import { AlertsView } from "./_components/alerts-view";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="alerts" />
      <AlertsView fallback={getAlerts()} />
    </div>
  );
}
