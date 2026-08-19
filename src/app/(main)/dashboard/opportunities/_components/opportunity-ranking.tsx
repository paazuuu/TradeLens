"use client";

import * as React from "react";

import { type ColumnFiltersState, type PaginationState, type SortingState, useTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { dataTableFeatures } from "@/lib/data-table-features";
import type { Opportunity, TradeDirection } from "@/lib/research/types";

import { opportunityColumns } from "./columns";

const directionFilters: { value: "All" | TradeDirection; label: string }[] = [
  { value: "All", label: "すべて" },
  { value: "JP_TO_CN", label: "日本 → 中国" },
  { value: "CN_TO_JP", label: "中国 → 日本" },
];

export function OpportunityRanking({ data }: { data: Opportunity[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "score", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: opportunityColumns,
    state: { sorting, columnFilters, pagination },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });

  const activeDirection =
    (table.getColumn("bestDirection")?.getFilterValue() as "All" | TradeDirection | undefined) ?? "All";
  const visibleCount = table.getFilteredRowModel().rows.length;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-base">Opportunity Ranking</CardTitle>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            className="bg-muted p-0.75 text-muted-foreground **:data-[slot=toggle-group-item]:rounded-md **:data-[slot=toggle-group-item]:border **:data-[slot=toggle-group-item]:border-transparent **:data-[slot=toggle-group-item]:text-foreground/60 **:data-[slot=toggle-group-item]:hover:text-foreground [&_[data-slot=toggle-group-item][data-state=on]]:bg-background [&_[data-slot=toggle-group-item][data-state=on]]:text-foreground [&_[data-slot=toggle-group-item][data-state=on]]:shadow-sm dark:[&_[data-slot=toggle-group-item][data-state=on]]:border-input dark:[&_[data-slot=toggle-group-item][data-state=on]]:bg-input/30"
            onValueChange={(value) => {
              if (!value) return;
              table.getColumn("bestDirection")?.setFilterValue(value === "All" ? undefined : value);
              table.setPageIndex(0);
            }}
            size="sm"
            spacing={1}
            type="single"
            value={activeDirection}
          >
            {directionFilters.map((filter) => (
              <ToggleGroupItem key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Button
            size="sm"
            variant="outline"
            onClick={() => table.getColumn("score")?.toggleSorting(table.getColumn("score")?.getIsSorted() === "desc")}
          >
            <ArrowUpDown />
            Score順
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="overflow-x-auto">
          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
            <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-normal **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-cell']:py-3">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan={table.getVisibleLeafColumns().length}>
                    該当する商機がありません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="px-4 text-muted-foreground text-sm">{visibleCount} 件の商機を表示中</p>
      </CardContent>
    </Card>
  );
}
