"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy } from "@/lib/research/format";
import type { SimilarProduct } from "@/lib/research/types";

/** 類似・代替候補（Phase 2、UI-005 内）。 */
export function SimilarProducts({ items }: { items: SimilarProduct[] }) {
  const { m } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{m.similar.title}</CardTitle>
        <CardDescription>{m.similar.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{m.similar.empty}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50"
                  href={`/dashboard/products/${item.id}`}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-sm">{item.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.subCategory} ・ {item.brand} ・ {m.labels.directionShort[item.bestDirection]}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">{m.similar.similarity}</span>
                      <span className="font-medium text-sm tabular-nums">{item.similarity}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">{m.productDetail.opportunityScore}</span>
                      <span className="font-medium text-sm tabular-nums">{item.score}</span>
                    </div>
                    <div className="hidden flex-col sm:flex">
                      <span className="text-muted-foreground text-xs">{m.productDetail.estimatedProfit}</span>
                      <span className="font-medium text-sm tabular-nums">{formatJpy(item.estimatedProfit)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
