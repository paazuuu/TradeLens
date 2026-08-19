import { fetchSeasonal } from "@/lib/research/data-source";

import { PageHeader } from "../_components/page-header";
import { SeasonalList } from "./_components/seasonal-list";

export default async function Page() {
  const items = await fetchSeasonal();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="seasonal" />
      <SeasonalList items={items} />
    </div>
  );
}
