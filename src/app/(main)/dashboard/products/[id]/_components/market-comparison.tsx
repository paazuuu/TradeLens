"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy, formatPercent } from "@/lib/research/format";
import type { MarketSnapshot, ProductDetail } from "@/lib/research/types";

function MarketCard({
  flag,
  title,
  snapshot,
  isSellSide,
  sellLabel,
  buyLabel,
  labels,
}: {
  flag: string;
  title: string;
  snapshot: MarketSnapshot;
  isSellSide: boolean;
  sellLabel: string;
  buyLabel: string;
  labels: { salesPrice: string; competitors: string; demand: string; reviews: string };
}) {
  const rows = [
    { label: labels.salesPrice, value: formatJpy(snapshot.price) },
    { label: labels.competitors, value: snapshot.competitors.toLocaleString() },
    { label: labels.demand, value: `${snapshot.demandIndex}/100` },
    { label: labels.reviews, value: snapshot.reviewCount.toLocaleString() },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>
            {flag} {title}
          </span>
          <span
            className={
              isSellSide
                ? "rounded-full border border-green-700/25 px-2 py-0.5 text-green-700 text-xs dark:border-green-300/25 dark:text-green-300"
                : "rounded-full border px-2 py-0.5 text-muted-foreground text-xs"
            }
          >
            {isSellSide ? sellLabel : buyLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((row) => (
          <div className="flex items-center justify-between text-sm" key={row.label}>
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium tabular-nums">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MarketComparison({ detail }: { detail: ProductDetail }) {
  const { m } = useI18n();
  const isImport = detail.bestDirection === "CN_TO_JP";
  const labels = {
    salesPrice: m.productDetail.salesPrice,
    competitors: m.productDetail.competitors,
    demand: m.productDetail.demand,
    reviews: m.productDetail.reviews,
  };
  // 販売側バッジ文言: 販売価格ラベルを流用（販売市場である旨を示す）。
  const sellLabel = m.productDetail.sellPrice;
  const buyLabel = m.productDetail.purchasePrice;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {m.opportunities.columns.priceGap}:{" "}
        <span className="font-medium tabular-nums">{formatPercent(detail.priceGapRate)}</span>
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MarketCard
          flag="🇯🇵"
          isSellSide={isImport}
          labels={labels}
          snapshot={detail.japan}
          title={m.productDetail.japanMarket}
          sellLabel={sellLabel}
          buyLabel={buyLabel}
        />
        <MarketCard
          flag="🇨🇳"
          isSellSide={!isImport}
          labels={labels}
          snapshot={detail.china}
          title={m.productDetail.chinaMarket}
          sellLabel={sellLabel}
          buyLabel={buyLabel}
        />
      </div>
    </div>
  );
}
