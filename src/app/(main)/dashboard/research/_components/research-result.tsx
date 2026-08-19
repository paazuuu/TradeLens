"use client";

import Link from "next/link";

import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ResearchResult } from "@/lib/research/research-flow";

interface ResearchResultViewProps {
  category: string;
  result: ResearchResult;
  onReset: () => void;
}

export function ResearchResultView({ category, result, onReset }: ResearchResultViewProps) {
  const { m } = useI18n();
  const r = m.research;

  const stats = [
    { label: r.statsAnalyzed, value: result.productsAnalyzed.toLocaleString() },
    { label: r.statsFound, value: result.opportunitiesFound.toLocaleString() },
    { label: r.statsJpToCn, value: result.jpToCn.toLocaleString() },
    { label: r.statsCnToJp, value: result.cnToJp.toLocaleString() },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <CheckCircle2 className="size-5" />
          <CardTitle className="text-foreground">{r.resultTitle}</CardTitle>
        </div>
        <CardDescription>
          {r.resultDescription(
            category,
            result.productsAnalyzed.toLocaleString(),
            result.opportunitiesFound.toLocaleString(),
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div className="flex flex-col gap-1 rounded-lg border p-4" key={stat.label}>
              <span className="text-muted-foreground text-sm">{stat.label}</span>
              <span className="font-semibold text-2xl tabular-nums leading-none tracking-tight">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onReset} type="button" variant="outline">
            <RotateCcw />
            {r.reset}
          </Button>
          <Button asChild>
            <Link href="/dashboard/opportunities">
              {r.viewOpportunities}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
