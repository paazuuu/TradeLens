"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy, formatPercent } from "@/lib/research/format";
import type { ProductDetail } from "@/lib/research/types";

export function ProfitBreakdown({ detail }: { detail: ProductDetail }) {
  const { m } = useI18n();
  const p = m.productDetail;
  const { economics } = detail;
  const cost = economics.cost;

  const costRows = [
    { label: p.purchasePrice, value: cost.purchasePrice },
    { label: p.intlShipping, value: cost.intlShipping },
    { label: p.domesticShipping, value: cost.domesticShipping },
    { label: p.importTax, value: cost.importTax },
    { label: p.platformFee, value: cost.platformFee },
    { label: p.packaging, value: cost.packaging },
    { label: p.other, value: cost.other },
  ];

  const profitPositive = economics.estimatedProfit >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{p.profitTitle}</CardTitle>
        <CardDescription>{p.profitDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {costRows.map((row) => (
            <div className="flex items-center justify-between text-sm" key={row.label}>
              <span className="text-muted-foreground">{row.label}</span>
              <span className="tabular-nums">− {formatJpy(row.value)}</span>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{p.totalCost}</span>
            <span className="font-medium tabular-nums">{formatJpy(economics.totalCost)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{p.sellPrice}</span>
            <span className="tabular-nums">{formatJpy(economics.sellPrice)}</span>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">{p.estimatedProfit}</span>
            <span
              className={
                profitPositive
                  ? "font-semibold text-green-700 text-xl tabular-nums dark:text-green-300"
                  : "font-semibold text-destructive text-xl tabular-nums"
              }
            >
              {formatJpy(economics.estimatedProfit)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">{p.margin}</span>
            <span className="font-semibold text-xl tabular-nums">{formatPercent(economics.marginRate)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">{p.roi}</span>
            <span className="font-semibold text-xl tabular-nums">{formatPercent(economics.roi)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">{p.breakEven}</span>
            <span className="font-semibold text-xl tabular-nums">{formatJpy(economics.breakEvenSellPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
