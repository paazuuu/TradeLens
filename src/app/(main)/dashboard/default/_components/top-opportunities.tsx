"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { TopOpportunity } from "@/lib/research/dashboard";
import { formatJpy, formatPercent } from "@/lib/research/format";
import type { TradeDirection } from "@/lib/research/types";

function directionClass(direction: TradeDirection): string {
  return direction === "JP_TO_CN"
    ? "border-blue-700/25 text-blue-700 dark:border-blue-300/25 dark:text-blue-300"
    : "border-rose-700/25 text-rose-700 dark:border-rose-300/25 dark:text-rose-300";
}

export function TopOpportunities({ items }: { items: TopOpportunity[] }) {
  const { m } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{m.dashboard.topOpportunities}</CardTitle>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/opportunities">
              {m.dashboard.viewAll}
              <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((item, index) => (
          <Link
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            href={`/dashboard/products/${item.id}`}
            key={item.id}
          >
            <span className="w-5 text-center font-semibold text-muted-foreground tabular-nums">{index + 1}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-sm">{item.name}</span>
                <Badge className={directionClass(item.bestDirection)} variant="outline">
                  {m.labels.directionShort[item.bestDirection]}
                </Badge>
              </div>
              {item.topReason ? (
                <span className="text-muted-foreground text-xs">{m.reasons[item.topReason]}</span>
              ) : null}
            </div>
            <div className="hidden shrink-0 flex-col items-end sm:flex">
              <span className="font-medium text-sm tabular-nums">{formatJpy(item.estimatedProfit)}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{formatPercent(item.marginRate)}</span>
            </div>
            <div className="flex w-12 shrink-0 flex-col items-end">
              <span className="font-semibold text-green-700 text-lg tabular-nums dark:text-green-300">
                {item.score}
              </span>
              <span className="text-muted-foreground text-xs">{m.opportunities.columns.score}</span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
