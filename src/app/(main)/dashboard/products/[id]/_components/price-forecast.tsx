"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy } from "@/lib/research/format";
import type { ForecastSeries, PriceHistory, ProductForecast } from "@/lib/research/types";

/** "YYYY-MM" を "MM月" 相当の短縮表示にする（言語非依存の数値）。 */
function shortMonth(date: string): string {
  return `${Number(date.slice(5, 7))}`;
}

/** 傾きから上昇/下降/横ばいの文言を選ぶ。epsilon は系列スケールに応じて渡す。 */
function trendLabel(slope: number, epsilon: number, labels: { up: string; down: string; flat: string }): string {
  if (slope > epsilon) return labels.up;
  if (slope < -epsilon) return labels.down;
  return labels.flat;
}

/** 実績（solid）+ 予測（dashed）を 1 本の時間軸に結合したチャート。 */
function ForecastChart({
  actual,
  series,
  color,
  valueFormatter,
  actualLabel,
  forecastLabel,
}: {
  actual: { date: string; value: number }[];
  series: ForecastSeries;
  color: string;
  valueFormatter: (value: number) => string;
  actualLabel: string;
  forecastLabel: string;
}) {
  const rows: { date: string; actual: number | null; forecast: number | null }[] = actual.map((p) => ({
    date: p.date,
    actual: p.value,
    forecast: null,
  }));
  // 実績の最終点に予測を接続し、線を連続させる。
  if (rows.length > 0) rows[rows.length - 1].forecast = actual[actual.length - 1].value;
  for (const point of series.points) {
    rows.push({ date: point.date, actual: null, forecast: point.value });
  }

  const config = {
    actual: { label: actualLabel, color },
    forecast: { label: forecastLabel, color },
  } satisfies ChartConfig;

  return (
    <ChartContainer className="h-56 w-full" config={config}>
      <LineChart accessibilityLayer data={rows} margin={{ top: 8, left: 0, right: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis axisLine={false} dataKey="date" tickFormatter={shortMonth} tickLine={false} tickMargin={8} />
        <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11 }} tickFormatter={valueFormatter} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <Line dataKey="actual" dot={false} stroke="var(--color-actual)" strokeWidth={2} type="monotone" />
        <Line
          connectNulls
          dataKey="forecast"
          dot={false}
          stroke="var(--color-forecast)"
          strokeDasharray="5 4"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  );
}

/** 価格・需要の履歴と予測（Phase 2、UI-005 内）。 */
export function PriceForecast({ history, forecast }: { history: PriceHistory; forecast: ProductForecast }) {
  const { m } = useI18n();
  const isJapanSell = forecast.market === "JP";

  const historyRows = history.japan.map((point, index) => ({
    date: point.date,
    jp: point.price,
    cn: history.china[index]?.price ?? 0,
  }));

  const historyConfig = {
    jp: { label: m.forecast.japanPrice, color: "var(--chart-1)" },
    cn: { label: m.forecast.chinaPrice, color: "var(--chart-2)" },
  } satisfies ChartConfig;

  // 予測対象（販売市場）の実績系列。
  const sellHistory = isJapanSell ? history.japan : history.china;
  const priceActual = sellHistory.map((p) => ({ date: p.date, value: p.price }));
  const demandActual = sellHistory.map((p) => ({ date: p.date, value: p.demand }));

  const trendLabels = { up: m.forecast.trendUp, down: m.forecast.trendDown, flat: m.forecast.trendFlat };
  const priceTrend = trendLabel(forecast.priceForecast.slopePerMonth, 1, trendLabels);
  const demandTrend = trendLabel(forecast.demandForecast.slopePerMonth, 0.1, trendLabels);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{m.forecast.historyTitle}</CardTitle>
          <CardDescription>{m.forecast.historyDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-56 w-full" config={historyConfig}>
            <LineChart accessibilityLayer data={historyRows} margin={{ top: 8, left: 0, right: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="date" tickFormatter={shortMonth} tickLine={false} tickMargin={8} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={44}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => formatJpy(v)}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Line dataKey="jp" dot={false} stroke="var(--color-jp)" strokeWidth={2} type="monotone" />
              <Line dataKey="cn" dot={false} stroke="var(--color-cn)" strokeWidth={2} type="monotone" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{m.forecast.priceForecast}</span>
              <span className="rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
                {priceTrend} · {m.forecast.confidence} {forecast.priceForecast.confidence}%
              </span>
            </CardTitle>
            <CardDescription>{m.forecast.forecastDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastChart
              actual={priceActual}
              actualLabel={m.forecast.actual}
              color="var(--chart-1)"
              forecastLabel={m.forecast.forecastLabel}
              series={forecast.priceForecast}
              valueFormatter={(v) => formatJpy(v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{m.forecast.demandForecast}</span>
              <span className="rounded-full border px-2 py-0.5 text-muted-foreground text-xs">
                {demandTrend} · {m.forecast.confidence} {forecast.demandForecast.confidence}%
              </span>
            </CardTitle>
            <CardDescription>{m.forecast.demandUnit}（0-100）</CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastChart
              actual={demandActual}
              actualLabel={m.forecast.actual}
              color="var(--chart-3)"
              forecastLabel={m.forecast.forecastLabel}
              series={forecast.demandForecast}
              valueFormatter={(v) => `${v}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
