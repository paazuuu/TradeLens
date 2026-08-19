"use client";

import { Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { confidenceTier } from "@/lib/research/format";
import type { ProductDetail } from "@/lib/research/types";

function tierLabel(value: number, labels: { high: string; medium: string; low: string }): string {
  const tier = confidenceTier(value);
  if (tier === "High") return labels.high;
  if (tier === "Medium") return labels.medium;
  return labels.low;
}

export function AiExplanation({ detail }: { detail: ProductDetail }) {
  const { m } = useI18n();
  const p = m.productDetail;
  const tierLabels = { high: m.common.high, medium: m.common.medium, low: m.common.low };

  const confidences = [
    { label: p.confidenceMatch, value: detail.confidence.match },
    { label: p.confidencePrice, value: detail.confidence.price },
    { label: p.confidenceProfit, value: detail.confidence.profit },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{p.aiTitle}</CardTitle>
        <CardDescription>{p.aiDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ul className="flex flex-col gap-2">
          {detail.reasons.map((reason) => (
            <li className="flex items-start gap-2 text-sm" key={reason}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-green-700/15 text-green-700 dark:text-green-300">
                <Check className="size-3" />
              </span>
              <span>{m.reasons[reason]}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4">
          <span className="font-medium text-sm">{m.common.dataConfidence}</span>
          {confidences.map((item) => (
            <div className="flex flex-col gap-1.5" key={item.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="tabular-nums">
                  {item.value}% ・ {tierLabel(item.value, tierLabels)}
                </span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
