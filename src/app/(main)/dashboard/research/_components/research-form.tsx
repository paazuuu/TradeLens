"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import type { ResearchDirection, ResearchOptions } from "@/lib/research/research-flow";

const directionOptions: { value: ResearchDirection; label: string }[] = [
  { value: "BOTH", label: "両方向" },
  { value: "JP_TO_CN", label: "日本 → 中国" },
  { value: "CN_TO_JP", label: "中国 → 日本" },
];

const includeOptions: { key: "includeSeasonal" | "includeOem" | "includeSimilar"; label: string }[] = [
  { key: "includeSeasonal", label: "季節商品を含める" },
  { key: "includeOem", label: "OEM候補を含める" },
  { key: "includeSimilar", label: "類似商品を含める" },
];

interface ResearchFormProps {
  options: ResearchOptions;
  onChange: (options: ResearchOptions) => void;
  onSubmit: () => void;
}

const exampleCategories = ["キャンプ用品", "美容用品", "キッチン用品", "ペット用品", "文房具"];

export function ResearchForm({ options, onChange, onSubmit }: ResearchFormProps) {
  const canSubmit = options.category.trim().length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSubmit) onSubmit();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 商品リサーチ</CardTitle>
        <CardDescription>
          カテゴリーを入力すると、AI が日本市場と中国市場を横断して越境の商機を調査します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="research-category">何を探しますか？</Label>
            <Input
              autoComplete="off"
              id="research-category"
              onChange={(event) => onChange({ ...options, category: event.target.value })}
              placeholder="例: キャンプ用品"
              value={options.category}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {exampleCategories.map((category) => (
                <Button
                  key={category}
                  onClick={() => onChange({ ...options, category })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 font-medium text-sm">対象の商流方向</legend>
              <RadioGroup
                className="gap-2"
                onValueChange={(value) => onChange({ ...options, direction: value as ResearchDirection })}
                value={options.direction}
              >
                {directionOptions.map((option) => (
                  <div className="flex items-center gap-2" key={option.value}>
                    <RadioGroupItem id={`direction-${option.value}`} value={option.value} />
                    <Label className="font-normal" htmlFor={`direction-${option.value}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 font-medium text-sm">調査対象に含めるもの</legend>
              {includeOptions.map((option) => (
                <div className="flex items-center gap-2" key={option.key}>
                  <Checkbox
                    checked={options[option.key]}
                    id={option.key}
                    onCheckedChange={(checked) => onChange({ ...options, [option.key]: checked === true })}
                  />
                  <Label className="font-normal" htmlFor={option.key}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </fieldset>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="min-margin">最低利益率</Label>
                <span className="font-medium text-sm tabular-nums">{options.minMargin}%</span>
              </div>
              <Slider
                id="min-margin"
                max={60}
                min={0}
                onValueChange={([value]) => onChange({ ...options, minMargin: value })}
                step={5}
                value={[options.minMargin]}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="min-score">最低 Opportunity Score</Label>
                <span className="font-medium text-sm tabular-nums">{options.minScore}</span>
              </div>
              <Slider
                id="min-score"
                max={100}
                min={0}
                onValueChange={([value]) => onChange({ ...options, minScore: value })}
                step={5}
                value={[options.minScore]}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button disabled={!canSubmit} type="submit">
              <Sparkles />
              AI リサーチ開始
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
