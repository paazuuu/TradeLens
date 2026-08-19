import { getAlerts } from "@/lib/research/alerts";

import { PageHeader } from "../_components/page-header";
import { AlertList } from "./_components/alert-list";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="alerts" />
      <AlertList alerts={getAlerts()} />
    </div>
  );
}
