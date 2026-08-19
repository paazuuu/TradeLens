import { getProductDetail, productCatalog } from "@/lib/research/mock-data";

import { AiExplanation } from "./_components/ai-explanation";
import { MarketComparison } from "./_components/market-comparison";
import { ProductHeader } from "./_components/product-header";
import { ProductNotFound } from "./_components/product-not-found";
import { ProfitSimulator } from "./_components/profit-simulator";

/** モックカタログの全 ID を静的生成する（実データ接続時は動的取得へ移行）。 */
export function generateStaticParams() {
  return productCatalog.map((entry) => ({ id: entry.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getProductDetail(id);

  if (!detail) {
    return <ProductNotFound />;
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <ProductHeader detail={detail} />
      <MarketComparison detail={detail} />
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <ProfitSimulator detail={detail} />
        <AiExplanation detail={detail} />
      </div>
    </div>
  );
}
