"use client";

import { ArrowLeftRight, Percent, Target, TrendingUp } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy, formatPercent } from "@/lib/research/format";
import type { Opportunity } from "@/lib/research/types";

function averageBy(items: Opportunity[], selector: (item: Opportunity) => number): number {
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + selector(item), 0) / items.length;
}

export function OpportunitySummary({ data }: { data: Opportunity[] }) {
  const { m } = useI18n();
  const s = m.opportunities.summary;

  const total = data.length;
  const exportCount = data.filter((item) => item.bestDirection === "JP_TO_CN").length;
  const importCount = data.filter((item) => item.bestDirection === "CN_TO_JP").length;
  const avgMargin = averageBy(data, (item) => item.marginRate);
  const avgProfit = averageBy(data, (item) => item.estimatedProfit);
  const avgScore = averageBy(data, (item) => item.score);

  const cards = [
    { title: s.total, value: String(total), hint: s.totalHint(exportCount, importCount), icon: Target },
    { title: s.avgScore, value: avgScore.toFixed(0), hint: s.avgScoreHint, icon: TrendingUp },
    {
      title: s.avgMargin,
      value: formatPercent(avgMargin),
      hint: s.avgMarginHint(formatJpy(Math.round(avgProfit))),
      icon: Percent,
    },
    {
      title: s.bidirectional,
      value: `${exportCount} / ${importCount}`,
      hint: s.bidirectionalHint,
      icon: ArrowLeftRight,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle className="font-normal text-muted-foreground text-sm">{card.title}</CardTitle>
            <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
              {card.value}
            </CardDescription>
            <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
              <card.icon className="size-3 text-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
