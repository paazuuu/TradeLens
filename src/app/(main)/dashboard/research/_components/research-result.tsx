"use client";

import Link from "next/link";

import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResearchResult } from "@/lib/research/research-flow";

interface ResearchResultViewProps {
  category: string;
  result: ResearchResult;
  onReset: () => void;
}

export function ResearchResultView({ category, result, onReset }: ResearchResultViewProps) {
  const stats = [
    { label: "分析商品数", value: result.productsAnalyzed.toLocaleString() },
    { label: "有望商品数", value: result.opportunitiesFound.toLocaleString() },
    { label: "日本 → 中国", value: result.jpToCn.toLocaleString() },
    { label: "中国 → 日本", value: result.cnToJp.toLocaleString() },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <CheckCircle2 className="size-5" />
          <CardTitle className="text-foreground">リサーチ完了</CardTitle>
        </div>
        <CardDescription>
          「{category}」について {result.productsAnalyzed.toLocaleString()} 商品を分析し、
          {result.opportunitiesFound.toLocaleString()} 件の有望候補が見つかりました。
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
            条件を変えて再検索
          </Button>
          <Button asChild>
            <Link href="/dashboard/opportunities">
              有望商品ランキングを見る
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
