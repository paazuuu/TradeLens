"use client";

import { ArrowLeftRight, ArrowRight, Package, Percent, SunSnow, Target } from "lucide-react";

import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { DashboardKpis } from "@/lib/research/dashboard";
import { formatPercent } from "@/lib/research/format";

export function CrossBorderKpis({ kpis }: { kpis: DashboardKpis }) {
  const { m } = useI18n();
  const k = m.dashboard.kpi;

  const cards = [
    { title: k.totalProducts, value: kpis.totalProducts.toLocaleString(), icon: Package },
    { title: k.promising, value: kpis.promising.toLocaleString(), icon: Target },
    { title: k.jpToCn, value: kpis.jpToCn.toLocaleString(), icon: ArrowRight },
    { title: k.cnToJp, value: kpis.cnToJp.toLocaleString(), icon: ArrowLeftRight },
    { title: k.seasonal, value: kpis.seasonal.toLocaleString(), icon: SunSnow },
    { title: k.avgMargin, value: formatPercent(kpis.avgMargin), icon: Percent },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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
        </Card>
      ))}
    </div>
  );
}
