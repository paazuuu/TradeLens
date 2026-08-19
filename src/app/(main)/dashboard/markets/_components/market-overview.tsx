"use client";

import { Coins, Users } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy } from "@/lib/research/format";
import type { MarketOverview as MarketOverviewData } from "@/lib/research/markets";

export function MarketOverview({ overview }: { overview: MarketOverviewData }) {
  const { m } = useI18n();

  const cards = [
    {
      title: m.markets.japanAvgPrice,
      value: formatJpy(overview.japanAvgPrice),
      hint: `${m.markets.chinaAvgPrice}: ${formatJpy(overview.chinaAvgPrice)}`,
      icon: Coins,
    },
    {
      title: m.markets.chinaAvgPrice,
      value: formatJpy(overview.chinaAvgPrice),
      hint: `${m.markets.japanAvgPrice}: ${formatJpy(overview.japanAvgPrice)}`,
      icon: Coins,
    },
    {
      title: m.markets.avgCompetitors,
      value: m.markets.japanChinaHint(
        overview.japanAvgCompetitors.toLocaleString(),
        overview.chinaAvgCompetitors.toLocaleString(),
      ),
      hint: m.productDetail.competitors,
      icon: Users,
    },
    {
      title: m.markets.avgDemand,
      value: m.markets.japanChinaHint(`${overview.japanAvgDemand}`, `${overview.chinaAvgDemand}`),
      hint: m.productDetail.demand,
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle className="font-normal text-muted-foreground text-sm">{card.title}</CardTitle>
            <CardDescription className="text-2xl text-foreground tabular-nums leading-none tracking-tight">
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
