"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReviewAnalysis as ReviewAnalysisData } from "@/lib/research/types";

/** レビュー分析（Phase 2、UI-005 内）。 */
export function ReviewAnalysis({ analysis }: { analysis: ReviewAnalysisData }) {
  const { m } = useI18n();
  const r = m.reviews;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{r.title}</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {r.sampleSize} {analysis.sampleSize.toLocaleString()}
          </span>
        </CardTitle>
        <CardDescription>{r.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-end gap-3">
          <span className="font-semibold text-3xl tabular-nums">{analysis.overall}</span>
          <span className="pb-1 text-muted-foreground text-sm">/ 100 ・ {r.overall}</span>
        </div>

        {/* 肯定/中立/否定の構成比。 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full">
            <div className="bg-green-600 dark:bg-green-500" style={{ width: `${analysis.positive}%` }} />
            <div className="bg-muted-foreground/40" style={{ width: `${analysis.neutral}%` }} />
            <div className="bg-red-600 dark:bg-red-500" style={{ width: `${analysis.negative}%` }} />
          </div>
          <div className="flex justify-between text-muted-foreground text-xs tabular-nums">
            <span>
              {r.positive} {analysis.positive}%
            </span>
            <span>
              {r.neutral} {analysis.neutral}%
            </span>
            <span>
              {r.negative} {analysis.negative}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {analysis.aspects.map((aspect) => (
            <div className="flex flex-col gap-1" key={aspect.aspect}>
              <div className="flex items-center justify-between text-sm">
                <span>{r.aspects[aspect.aspect]}</span>
                <span className="tabular-nums">
                  {aspect.sentiment}
                  <span className="ml-2 text-muted-foreground text-xs">
                    {r.mentions} {aspect.mentions.toLocaleString()}
                  </span>
                </span>
              </div>
              <Progress value={aspect.sentiment} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
