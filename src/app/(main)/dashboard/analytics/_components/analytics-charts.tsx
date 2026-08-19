"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { DirectionSplit, MarginBucket, ProfitByProduct, SubCategoryScore } from "@/lib/research/analytics";

interface AnalyticsChartsProps {
  directionSplit: DirectionSplit[];
  subCategoryScores: SubCategoryScore[];
  marginDistribution: MarginBucket[];
  profitByProduct: ProfitByProduct[];
}

export function AnalyticsCharts({
  directionSplit,
  subCategoryScores,
  marginDistribution,
  profitByProduct,
}: AnalyticsChartsProps) {
  const { m } = useI18n();

  const countConfig = { count: { label: m.analytics.count, color: "var(--chart-1)" } } satisfies ChartConfig;
  const scoreConfig = { avgScore: { label: m.analytics.avgScore, color: "var(--chart-2)" } } satisfies ChartConfig;
  const profitConfig = {
    estimatedProfit: { label: m.analytics.profit, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const directionData = directionSplit.map((d) => ({
    name: m.labels.directionShort[d.direction],
    count: d.count,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.analytics.directionSplitTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-56 w-full" config={countConfig}>
            <BarChart accessibilityLayer data={directionData} margin={{ top: 16, left: 0, right: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="name" tickLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]}>
                <LabelList className="fill-foreground" fontSize={12} position="top" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.analytics.marginDistributionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-56 w-full" config={countConfig}>
            <BarChart accessibilityLayer data={marginDistribution} margin={{ top: 16, left: 0, right: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]}>
                <LabelList className="fill-foreground" fontSize={12} position="top" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.analytics.subCategoryScoreTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-72 w-full" config={scoreConfig}>
            <BarChart
              accessibilityLayer
              data={subCategoryScores}
              layout="vertical"
              margin={{ top: 0, left: 8, right: 24, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis domain={[0, 100]} hide type="number" />
              <YAxis
                axisLine={false}
                dataKey="subCategory"
                tickLine={false}
                type="category"
                width={92}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={4}>
                <LabelList className="fill-foreground" fontSize={11} position="right" />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.analytics.profitByProductTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-72 w-full" config={profitConfig}>
            <BarChart
              accessibilityLayer
              data={profitByProduct}
              layout="vertical"
              margin={{ top: 0, left: 8, right: 40, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis hide type="number" />
              <YAxis
                axisLine={false}
                dataKey="name"
                tickFormatter={(value: string) => (value.length > 12 ? `${value.slice(0, 12)}…` : value)}
                tickLine={false}
                type="category"
                width={110}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="estimatedProfit" fill="var(--color-estimatedProfit)" radius={4}>
                <LabelList
                  className="fill-foreground"
                  fontSize={11}
                  formatter={(value) => `¥${Number(value).toLocaleString()}`}
                  position="right"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
