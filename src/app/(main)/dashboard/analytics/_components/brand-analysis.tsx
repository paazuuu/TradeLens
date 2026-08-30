"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy, formatPercent } from "@/lib/research/format";
import type { BrandStat, CompetitionLevel } from "@/lib/research/types";

/** 競合水準に応じた配色。 */
function competitionClass(level: CompetitionLevel): string {
  if (level === "low") return "text-green-700 dark:text-green-300";
  if (level === "medium") return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-300";
}

/** ブランド・競合分析テーブル（Phase 2、Analytics 内）。 */
export function BrandAnalysis({ brands }: { brands: BrandStat[] }) {
  const { m } = useI18n();
  const a = m.analytics;
  const competitionLabels = { low: m.common.low, medium: m.common.medium, high: m.common.high };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{a.brandTitle}</CardTitle>
        <CardDescription>{a.brandDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{a.brandColumn}</TableHead>
                <TableHead className="text-right">{a.products}</TableHead>
                <TableHead className="text-right">{a.avgScore}</TableHead>
                <TableHead className="text-right">{a.avgMargin}</TableHead>
                <TableHead className="text-right">{a.totalProfit}</TableHead>
                <TableHead className="text-right">{a.competition}</TableHead>
                <TableHead className="text-right">{a.oemShare}</TableHead>
                <TableHead className="text-right">{a.direction}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.brand}>
                  <TableCell className="font-medium">{brand.brand}</TableCell>
                  <TableCell className="text-right tabular-nums">{brand.productCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{brand.avgScore}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(brand.avgMarginRate)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatJpy(brand.totalEstimatedProfit)}</TableCell>
                  <TableCell className={`text-right ${competitionClass(brand.competitionLevel)}`}>
                    {competitionLabels[brand.competitionLevel]}
                    <span className="ml-1 text-muted-foreground text-xs tabular-nums">({brand.avgCompetitors})</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(brand.oemShare)}</TableCell>
                  <TableCell className="text-right">
                    {brand.dominantDirection ? m.labels.directionShort[brand.dominantDirection] : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
