import {
  fetchForecast,
  fetchImageComparison,
  fetchOemAnalysis,
  fetchPriceHistory,
  fetchProductDetail,
  fetchReviewAnalysis,
  fetchSimilarProducts,
} from "@/lib/research/data-source";
import { productCatalog } from "@/lib/research/mock-data";

import { AiExplanation } from "./_components/ai-explanation";
import { ImageComparison } from "./_components/image-comparison";
import { MarketComparison } from "./_components/market-comparison";
import { OemAnalysis } from "./_components/oem-analysis";
import { PriceForecast } from "./_components/price-forecast";
import { ProductHeader } from "./_components/product-header";
import { ProductNotFound } from "./_components/product-not-found";
import { ProfitSimulator } from "./_components/profit-simulator";
import { ReviewAnalysis } from "./_components/review-analysis";
import { SimilarProducts } from "./_components/similar-products";

/** モックカタログの全 ID を静的生成の候補にする（API 有効時は動的レンダリング）。 */
export function generateStaticParams() {
  return productCatalog.map((entry) => ({ id: entry.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await fetchProductDetail(id);

  if (!detail) {
    return <ProductNotFound />;
  }

  const [history, forecast, oem, similar, reviews, imageComparison] = await Promise.all([
    fetchPriceHistory(id),
    fetchForecast(id),
    fetchOemAnalysis(id),
    fetchSimilarProducts(id),
    fetchReviewAnalysis(id),
    fetchImageComparison(id),
  ]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <ProductHeader detail={detail} />
      <MarketComparison detail={detail} />
      {history && forecast ? <PriceForecast forecast={forecast} history={history} /> : null}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <ProfitSimulator detail={detail} />
        <AiExplanation detail={detail} />
      </div>
      {reviews || imageComparison ? (
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          {reviews ? <ReviewAnalysis analysis={reviews} /> : null}
          {imageComparison ? <ImageComparison comparison={imageComparison} /> : null}
        </div>
      ) : null}
      {oem ? <OemAnalysis analysis={oem} /> : null}
      {similar ? <SimilarProducts items={similar} /> : null}
    </div>
  );
}
