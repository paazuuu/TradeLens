"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy } from "@/lib/research/format";
import type { MarketComparisonRow } from "@/lib/research/markets";

export function MarketComparisonTable({ rows }: { rows: MarketComparisonRow[] }) {
  const { m } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{m.markets.comparisonTitle}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
            <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-normal **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
              <TableRow>
                <TableHead>{m.markets.subCategory}</TableHead>
                <TableHead className="text-right">{m.markets.products}</TableHead>
                <TableHead className="text-right">🇯🇵 {m.opportunities.columns.japanPrice}</TableHead>
                <TableHead className="text-right">🇨🇳 {m.opportunities.columns.chinaPrice}</TableHead>
                <TableHead className="text-right">{m.productDetail.competitors}</TableHead>
                <TableHead className="text-right">{m.productDetail.demand}</TableHead>
                <TableHead>{m.opportunities.columns.direction}</TableHead>
                <TableHead className="text-right">{m.analytics.avgScore}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-cell']:py-3">
              {rows.map((row) => (
                <TableRow key={row.subCategory}>
                  <TableCell className="font-medium">{row.subCategory}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.productCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatJpy(row.japan.avgPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatJpy(row.china.avgPrice)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs tabular-nums">
                    {m.markets.japanChinaHint(`${row.japan.avgCompetitors}`, `${row.china.avgCompetitors}`)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs tabular-nums">
                    {m.markets.japanChinaHint(`${row.japan.avgDemand}`, `${row.china.avgDemand}`)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {row.dominantDirection ? m.labels.directionShort[row.dominantDirection] : m.markets.bidirectional}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{row.avgScore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
