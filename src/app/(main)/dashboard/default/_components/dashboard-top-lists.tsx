"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Messages } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { TopListItem } from "@/lib/research/dashboard";
import { formatPercent } from "@/lib/research/format";
import type { SeasonalOpportunity } from "@/lib/research/seasonal";

function MiniList({
  title,
  items,
  formatValue,
  m,
}: {
  title: string;
  items: TopListItem[];
  formatValue: (value: number) => string;
  m: Messages;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            className="flex items-center justify-between gap-2 text-sm hover:underline"
            href={`/dashboard/products/${item.id}`}
            key={item.id}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 text-muted-foreground text-xs">{m.labels.directionShort[item.direction]}</span>
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">{formatValue(item.value)}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardTopLists({
  priceGap,
  margin,
  demand,
  seasonal,
}: {
  priceGap: TopListItem[];
  margin: TopListItem[];
  demand: TopListItem[];
  seasonal: SeasonalOpportunity[];
}) {
  const { m } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MiniList formatValue={(v) => formatPercent(v)} items={priceGap} m={m} title={m.dashboard.topPriceGap} />
      <MiniList formatValue={(v) => formatPercent(v)} items={margin} m={m} title={m.dashboard.topMargin} />
      <MiniList formatValue={(v) => `${v}`} items={demand} m={m} title={m.dashboard.topDemand} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{m.dashboard.topSeasonal}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {seasonal.map((item) => (
            <Link
              className="flex items-center justify-between gap-2 text-sm hover:underline"
              href={`/dashboard/products/${item.id}`}
              key={item.id}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-muted-foreground text-xs">{m.labels.season[item.season]}</span>
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                {m.seasonal.daysToPeak(item.daysToPeak)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
