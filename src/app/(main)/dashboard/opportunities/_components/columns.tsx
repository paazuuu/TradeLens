import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { DataTableFeatures } from "@/lib/data-table-features";
import {
  directionShortLabel,
  formatJpy,
  formatPercent,
  matchTypeLabel,
  riskLabel,
  seasonLabel,
} from "@/lib/research/format";
import type { Opportunity, RiskLevel, TradeDirection } from "@/lib/research/types";

function DirectionBadge({ direction }: { direction: TradeDirection }) {
  const isExport = direction === "JP_TO_CN";
  return (
    <Badge
      className={
        isExport
          ? "border-blue-700/25 text-blue-700 dark:border-blue-300/25 dark:text-blue-300"
          : "border-rose-700/25 text-rose-700 dark:border-rose-300/25 dark:text-rose-300"
      }
      variant="outline"
    >
      {directionShortLabel(direction)}
    </Badge>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  if (risk === "Low") {
    return (
      <Badge
        className="border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300"
        variant="outline"
      >
        {riskLabel(risk)}
      </Badge>
    );
  }
  if (risk === "High") {
    return <Badge variant="destructive">{riskLabel(risk)}</Badge>;
  }
  return (
    <Badge
      className="border-yellow-700/25 text-yellow-700 dark:border-yellow-300/25 dark:text-yellow-300"
      variant="outline"
    >
      {riskLabel(risk)}
    </Badge>
  );
}

function scoreTone(score: number): string {
  if (score >= 85) return "text-green-700 dark:text-green-300";
  if (score >= 70) return "text-foreground";
  return "text-muted-foreground";
}

function ScoreCell({ score }: { score: number }) {
  return <span className={`font-semibold tabular-nums ${scoreTone(score)}`}>{score}</span>;
}

export const opportunityColumns: ColumnDef<DataTableFeatures, Opportunity>[] = [
  {
    id: "rank",
    header: () => <div className="w-10 text-muted-foreground">#</div>,
    cell: ({ row, table }) => {
      const rank = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id) + 1;
      return <div className="w-10 text-muted-foreground tabular-nums">{rank}</div>;
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "商品",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <div className="font-medium leading-none">{row.original.name}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.brand} ・ {row.original.subCategory}
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "bestDirection",
    header: "方向",
    cell: ({ row }) => <DirectionBadge direction={row.original.bestDirection} />,
    filterFn: (row, _columnId, value) => value === "All" || row.original.bestDirection === value,
  },
  {
    accessorKey: "japanPrice",
    header: () => <div className="w-24 text-right">日本価格</div>,
    cell: ({ row }) => <div className="w-24 text-right tabular-nums">{formatJpy(row.original.japanPrice)}</div>,
  },
  {
    accessorKey: "chinaPrice",
    header: () => <div className="w-24 text-right">中国価格</div>,
    cell: ({ row }) => <div className="w-24 text-right tabular-nums">{formatJpy(row.original.chinaPrice)}</div>,
  },
  {
    accessorKey: "priceGapRate",
    header: () => <div className="w-20 text-right">価格差</div>,
    cell: ({ row }) => <div className="w-20 text-right tabular-nums">{formatPercent(row.original.priceGapRate)}</div>,
  },
  {
    accessorKey: "estimatedProfit",
    header: () => <div className="w-24 text-right">推定利益</div>,
    cell: ({ row }) => (
      <div className="w-24 text-right font-medium tabular-nums">{formatJpy(row.original.estimatedProfit)}</div>
    ),
  },
  {
    accessorKey: "marginRate",
    header: () => <div className="w-20 text-right">利益率</div>,
    cell: ({ row }) => <div className="w-20 text-right tabular-nums">{formatPercent(row.original.marginRate)}</div>,
  },
  {
    accessorKey: "seasonality",
    header: () => <div className="w-16">季節</div>,
    cell: ({ row }) => <div className="w-16 text-muted-foreground">{seasonLabel(row.original.seasonality)}</div>,
  },
  {
    accessorKey: "risk",
    header: () => <div className="w-16">リスク</div>,
    cell: ({ row }) => (
      <div className="w-16">
        <RiskBadge risk={row.original.risk} />
      </div>
    ),
  },
  {
    accessorKey: "matchConfidence",
    header: () => <div className="w-28">マッチ</div>,
    cell: ({ row }) => (
      <div className="flex w-28 flex-col gap-0.5">
        <span className="text-xs leading-none">{matchTypeLabel(row.original.matchType)}</span>
        <span className="text-muted-foreground text-xs tabular-nums">信頼度 {row.original.matchConfidence}%</span>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "score",
    header: () => <div className="w-16 text-right">Score</div>,
    cell: ({ row }) => (
      <div className="w-16 text-right">
        <ScoreCell score={row.original.score} />
      </div>
    ),
  },
];
