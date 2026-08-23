"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { KeywordBias, KeywordGap } from "@/lib/research/types";

function biasClass(bias: KeywordBias): string {
  if (bias === "jp") return "border-blue-700/25 text-blue-700 dark:border-blue-300/25 dark:text-blue-300";
  if (bias === "cn") return "border-red-700/25 text-red-700 dark:border-red-300/25 dark:text-red-300";
  return "text-muted-foreground";
}

/** 強度を細いバーで示す（幅は 0-100%）。 */
function StrengthBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={color} style={{ width: `${value}%`, height: "100%" }} />
      </div>
      <span className="w-7 text-right tabular-nums">{value}</span>
    </div>
  );
}

/** 中日市場のキーワード差分析（Phase 2、Markets 内）。 */
export function KeywordGaps({ gaps }: { gaps: KeywordGap[] }) {
  const { m } = useI18n();
  const k = m.keywords;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{k.title}</CardTitle>
        <CardDescription>{k.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{k.keyword}</TableHead>
                <TableHead className="text-right">{k.products}</TableHead>
                <TableHead className="text-right">{k.jpStrength}</TableHead>
                <TableHead className="text-right">{k.cnStrength}</TableHead>
                <TableHead className="text-right">{k.gap}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gaps.map((gap) => (
                <TableRow key={gap.keyword}>
                  <TableCell className="font-medium">{gap.keyword}</TableCell>
                  <TableCell className="text-right tabular-nums">{gap.productCount}</TableCell>
                  <TableCell>
                    <StrengthBar color="bg-blue-600 dark:bg-blue-500" value={gap.jpStrength} />
                  </TableCell>
                  <TableCell>
                    <StrengthBar color="bg-red-600 dark:bg-red-500" value={gap.cnStrength} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`rounded-full border px-2 py-0.5 text-xs tabular-nums ${biasClass(gap.bias)}`}>
                      {gap.gap > 0 ? `+${gap.gap}` : gap.gap} ・ {k.bias[gap.bias]}
                    </span>
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
