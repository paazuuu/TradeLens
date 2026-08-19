"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { Alert } from "@/lib/research/alerts";
import { formatJpy } from "@/lib/research/format";

export function AlertList({ alerts }: { alerts: Alert[] }) {
  const { m } = useI18n();

  if (alerts.length === 0) {
    return <p className="text-muted-foreground text-sm">{m.alerts.empty}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {alerts.map((alert) => {
        if (alert.kind === "opportunity") {
          return (
            <Card key={`opp-${alert.id}`}>
              <CardHeader className="gap-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="text-rose-700 dark:text-rose-300">{m.alerts.newOpportunity}</span>
                  <Badge variant="outline">{m.labels.directionShort[alert.direction]}</Badge>
                </CardTitle>
                <Link className="font-medium text-sm hover:underline" href={`/dashboard/products/${alert.id}`}>
                  {alert.name}
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">{m.opportunities.columns.score}</span>
                  <span className="tabular-nums">{alert.scoreFrom}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-green-700 tabular-nums dark:text-green-300">{alert.scoreTo}</span>
                  <span className="ml-auto font-medium text-sm tabular-nums">{formatJpy(alert.estimatedProfit)}</span>
                </div>
                {alert.reasons.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">{m.alerts.reasonsLabel}</span>
                    <ul className="flex flex-col gap-0.5">
                      {alert.reasons.map((reason) => (
                        <li className="text-xs" key={reason}>
                          ・{m.reasons[reason]}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={`season-${alert.id}`}>
            <CardHeader className="gap-2">
              <CardTitle className="text-green-700 text-sm dark:text-green-300">{m.alerts.seasonApproaching}</CardTitle>
              <Link className="font-medium text-sm hover:underline" href={`/dashboard/products/${alert.id}`}>
                {alert.name}
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{m.seasonal.peak}</span>
                <span className="tabular-nums">{m.seasonal.daysToPeak(alert.daysToPeak)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{m.alerts.recommendedResearch}</span>
                <span className="tabular-nums">{m.seasonal.monthLabel(alert.recommendedBuyMonth)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
