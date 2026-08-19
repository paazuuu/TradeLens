"use client";

import * as React from "react";

import { type CategoryTree, decomposeCategory } from "@/lib/research/agents";
import { runResearch } from "@/lib/research/data-source";
import {
  defaultResearchOptions,
  type ResearchOptions,
  type ResearchResult,
  researchStages,
} from "@/lib/research/research-flow";

import { ResearchForm } from "./research-form";
import { ResearchProgress } from "./research-progress";
import { ResearchResultView } from "./research-result";

type Phase = "form" | "running" | "done";

/** 各段階の擬似処理時間（ms）。Mock API の演出用。 */
const STAGE_DURATION_MS = 550;

export function ResearchWorkspace() {
  const [phase, setPhase] = React.useState<Phase>("form");
  const [options, setOptions] = React.useState<ResearchOptions>(defaultResearchOptions);
  const [completedCount, setCompletedCount] = React.useState(0);
  const [result, setResult] = React.useState<ResearchResult | null>(null);
  const [tree, setTree] = React.useState<CategoryTree | null>(null);

  // running フェーズの間、最終段階まで一定間隔で進める。
  React.useEffect(() => {
    if (phase !== "running" || completedCount >= researchStages.length) return;
    const timer = setTimeout(() => setCompletedCount((count) => count + 1), STAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase, completedCount]);

  // 最終段階に到達したら、カテゴリー分解（Category Agent）とリサーチ結果を並行取得し done へ。
  React.useEffect(() => {
    if (phase !== "running" || completedCount < researchStages.length) return;
    let cancelled = false;
    void Promise.all([runResearch(options), decomposeCategory(options.category)]).then(
      ([researchResult, categoryTree]) => {
        if (cancelled) return;
        setResult(researchResult);
        setTree(categoryTree);
        setPhase("done");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [phase, completedCount, options]);

  function handleSubmit() {
    setCompletedCount(0);
    setResult(null);
    setPhase("running");
  }

  function handleReset() {
    setCompletedCount(0);
    setResult(null);
    setTree(null);
    setPhase("form");
  }

  if (phase === "running") {
    return <ResearchProgress category={options.category} completedCount={completedCount} />;
  }

  if (phase === "done" && result) {
    return <ResearchResultView category={options.category} onReset={handleReset} result={result} tree={tree} />;
  }

  return <ResearchForm onChange={setOptions} onSubmit={handleSubmit} options={options} />;
}
