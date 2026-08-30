"use client";

import { ImageOff } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ImageComparison as ImageComparisonData, ImageVerdict } from "@/lib/research/types";

function verdictClass(verdict: ImageVerdict): string {
  if (verdict === "sameProduct")
    return "border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300";
  if (verdict === "likelySame")
    return "border-amber-700/25 text-amber-700 dark:border-amber-300/25 dark:text-amber-300";
  return "text-muted-foreground";
}

/** 画像未取得のプレースホルダータイル。 */
function ImageTile({ flag, url }: { flag: string; url: string | null }) {
  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted/40">
      {url ? (
        // biome-ignore lint/performance/noImgElement: 外部 URL のプレースホルダー表示のみ。
        <img alt="" className="size-full object-cover" src={url} />
      ) : (
        <ImageOff className="size-6 text-muted-foreground/60" />
      )}
      <span className="absolute top-1 left-1 text-sm">{flag}</span>
    </div>
  );
}

/** 画像比較（Phase 2、UI-005 内）。 */
export function ImageComparison({ comparison }: { comparison: ImageComparisonData }) {
  const { m } = useI18n();
  const i = m.imageComparison;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{i.title}</span>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${verdictClass(comparison.verdict)}`}>
            {i.verdict[comparison.verdict]}
          </span>
        </CardTitle>
        <CardDescription>{i.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <ImageTile flag="🇯🇵" url={comparison.jpImageUrl} />
          <ImageTile flag="🇨🇳" url={comparison.cnImageUrl} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{i.similarity}</span>
            <span className="tabular-nums">{comparison.similarity}%</span>
          </div>
          <Progress value={comparison.similarity} />
        </div>
        {!comparison.imagesAvailable ? <p className="text-muted-foreground text-xs">{i.unavailable}</p> : null}
      </CardContent>
    </Card>
  );
}
