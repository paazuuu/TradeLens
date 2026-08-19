"use client";

import { Check, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { researchStages } from "@/lib/research/research-flow";

interface ResearchProgressProps {
  category: string;
  /** 完了済みの段階数（0〜researchStages.length）。 */
  completedCount: number;
}

type StageState = "done" | "active" | "pending";

function markerClass(state: StageState): string {
  const base = "grid size-6 shrink-0 place-items-center rounded-full";
  if (state === "done") return `${base} bg-green-700/15 text-green-700 dark:text-green-300`;
  if (state === "active") return `${base} bg-muted text-foreground`;
  return `${base} bg-muted text-muted-foreground`;
}

function StageMarkerIcon({ state }: { state: StageState }) {
  if (state === "done") return <Check className="size-3.5" />;
  if (state === "active") return <Loader2 className="size-3.5 animate-spin" />;
  return <span className="size-1.5 rounded-full bg-current" />;
}

export function ResearchProgress({ category, completedCount }: ResearchProgressProps) {
  const { m } = useI18n();
  const total = researchStages.length;
  const percent = Math.round((completedCount / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.research.runningTitle}</CardTitle>
        <CardDescription>{m.research.runningDescription(category)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{m.research.progress}</span>
            <span className="font-medium tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>

        <ol className="flex flex-col gap-3">
          {researchStages.map((stage, index) => {
            let state: StageState = "pending";
            if (index < completedCount) state = "done";
            else if (index === completedCount) state = "active";

            const isReached = state !== "pending";

            return (
              <li className="flex items-center gap-3" key={stage.id}>
                <span className={markerClass(state)}>
                  <StageMarkerIcon state={state} />
                </span>
                <div className="flex flex-col">
                  <span className={isReached ? "text-sm" : "text-muted-foreground text-sm"}>{stage.label}</span>
                  <span className="text-muted-foreground text-xs">{m.research.stageNames[stage.id]}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
