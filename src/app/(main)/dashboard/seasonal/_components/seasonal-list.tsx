"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy } from "@/lib/research/format";
import type { SeasonalOpportunity, SeasonUrgency } from "@/lib/research/seasonal";

const urgencyEmoji: Record<SeasonUrgency, string> = { hot: "🔥", soon: "🟢", watch: "🟡", later: "⚪️" };

function urgencyBadgeClass(urgency: SeasonUrgency): string {
  switch (urgency) {
    case "hot":
      return "border-rose-700/25 text-rose-700 dark:border-rose-300/25 dark:text-rose-300";
    case "soon":
      return "border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300";
    case "watch":
      return "border-yellow-700/25 text-yellow-700 dark:border-yellow-300/25 dark:text-yellow-300";
    default:
      return "text-muted-foreground";
  }
}

export function SeasonalList({ items }: { items: SeasonalOpportunity[] }) {
  const { m } = useI18n();

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{m.seasonal.empty}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between">
              <Badge className={urgencyBadgeClass(item.urgency)} variant="outline">
                {urgencyEmoji[item.urgency]} {m.seasonal.urgency[item.urgency]}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {m.labels.season[item.season]} ・ {m.labels.directionShort[item.bestDirection]}
              </span>
            </div>
            <Link className="font-medium text-sm leading-snug hover:underline" href={`/dashboard/products/${item.id}`}>
              {item.name}
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{m.seasonal.peak}</span>
                <span className="tabular-nums">{m.seasonal.monthLabel(item.peakMonth)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{m.seasonal.recommendedBuy}</span>
                <span className="tabular-nums">{m.seasonal.monthLabel(item.recommendedBuyMonth)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">
                  {m.seasonal.currentScore} → {m.seasonal.predictedScore}
                </span>
                <span className="tabular-nums">
                  {item.currentScore} →{" "}
                  <span className="font-semibold text-green-700 dark:text-green-300">{item.predictedScore}</span>
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{m.productDetail.estimatedProfit}</span>
                <span className="font-medium tabular-nums">{formatJpy(item.estimatedProfit)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground text-xs tabular-nums">
                {m.seasonal.daysToPeak(item.daysToPeak)}
              </span>
              <Link
                className="inline-flex items-center gap-1 text-sm hover:underline"
                href={`/dashboard/products/${item.id}`}
              >
                {m.common.viewRanking}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
