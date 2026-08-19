import { PageHeader } from "../_components/page-header";
import { WatchlistManager } from "./_components/watchlist-manager";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="watchlists" />
      <WatchlistManager />
    </div>
  );
}
