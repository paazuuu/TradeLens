"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { OemAnalysis as OemAnalysisData, OemVerdict } from "@/lib/research/types";

/** 判定に応じたバッジ配色。 */
function verdictClass(verdict: OemVerdict): string {
  if (verdict === "likely") {
    return "border-amber-700/25 text-amber-700 dark:border-amber-300/25 dark:text-amber-300";
  }
  if (verdict === "possible") {
    return "border-muted-foreground/30 text-foreground";
  }
  return "text-muted-foreground";
}

/** OEM 分析（Phase 2、UI-005 内）。 */
export function OemAnalysis({ analysis }: { analysis: OemAnalysisData }) {
  const { m } = useI18n();
  const o = m.oem;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{o.title}</span>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${verdictClass(analysis.verdict)}`}>
            {o.verdict[analysis.verdict]}
          </span>
        </CardTitle>
        <CardDescription>{o.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{o.likelihood}</span>
            <span className="tabular-nums">{analysis.score}/100</span>
          </div>
          <Progress value={analysis.score} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{o.supplyStability}</span>
            <span className="tabular-nums">{Math.round(analysis.supplyStability * 100)}%</span>
          </div>
          <Progress value={Math.round(analysis.supplyStability * 100)} />
        </div>

        {analysis.signals.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.signals.map((signal) => (
              <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-muted-foreground text-xs" key={signal}>
                {o.signals[signal]}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
