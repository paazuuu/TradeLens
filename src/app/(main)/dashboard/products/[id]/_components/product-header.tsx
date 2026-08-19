"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ProductDetail } from "@/lib/research/types";

export function ProductHeader({ detail }: { detail: ProductDetail }) {
  const { m } = useI18n();

  const scores = [
    { label: m.productDetail.opportunityScore, value: detail.score },
    { label: m.productDetail.matchScore, value: detail.matchConfidence },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/opportunities">
            <ArrowLeft />
            {m.productDetail.backToRanking}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-sm">
              {detail.category} ・ {detail.subCategory}
            </span>
            <h1 className="font-semibold text-2xl tracking-tight">{detail.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <span>{detail.brand}</span>
              <span>・</span>
              <span>
                {m.productDetail.model}: {detail.model}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">{m.labels.direction[detail.bestDirection]}</Badge>
              <Badge variant="outline">{m.labels.season[detail.seasonality]}</Badge>
              <Badge variant="outline">
                {m.opportunities.columns.risk}: {m.labels.risk[detail.risk]}
              </Badge>
              <Badge variant="outline">{m.labels.matchType[detail.matchType]}</Badge>
            </div>
          </div>

          <div className="flex gap-3">
            {scores.map((score) => (
              <div className="flex min-w-24 flex-col items-center rounded-lg border p-3" key={score.label}>
                <span className="font-semibold text-2xl tabular-nums leading-none">{score.value}</span>
                <span className="pt-1 text-center text-muted-foreground text-xs">{score.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
