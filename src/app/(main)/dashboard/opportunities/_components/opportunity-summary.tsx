import { ArrowLeftRight, Percent, Target, TrendingUp } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatJpy, formatPercent } from "@/lib/research/format";
import type { Opportunity } from "@/lib/research/types";

function averageBy(items: Opportunity[], selector: (item: Opportunity) => number): number {
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + selector(item), 0) / items.length;
}

export function OpportunitySummary({ data }: { data: Opportunity[] }) {
  const total = data.length;
  const exportCount = data.filter((item) => item.bestDirection === "JP_TO_CN").length;
  const importCount = data.filter((item) => item.bestDirection === "CN_TO_JP").length;
  const avgMargin = averageBy(data, (item) => item.marginRate);
  const avgProfit = averageBy(data, (item) => item.estimatedProfit);
  const avgScore = averageBy(data, (item) => item.score);

  const cards = [
    { title: "有望商品数", value: String(total), hint: `日→中 ${exportCount} ・ 中→日 ${importCount}`, icon: Target },
    { title: "平均 Opportunity Score", value: avgScore.toFixed(0), hint: "有望方向側の平均", icon: TrendingUp },
    {
      title: "平均利益率",
      value: formatPercent(avgMargin),
      hint: `平均推定利益 ${formatJpy(Math.round(avgProfit))}`,
      icon: Percent,
    },
    { title: "双方向カバー", value: `${exportCount} / ${importCount}`, hint: "日→中 / 中→日", icon: ArrowLeftRight },
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
