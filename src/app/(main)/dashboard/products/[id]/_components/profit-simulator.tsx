"use client";

import * as React from "react";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJpy, formatPercent } from "@/lib/research/format";
import type { ProductDetail } from "@/lib/research/types";

/** シミュレーターの編集可能な入力値。 */
interface SimInputs {
  sellPrice: number;
  purchasePrice: number;
  intlShipping: number;
  domesticShipping: number;
  importTax: number;
  platformFee: number;
  packaging: number;
  other: number;
}

function initialInputs(detail: ProductDetail): SimInputs {
  const { economics } = detail;
  return {
    sellPrice: economics.sellPrice,
    purchasePrice: economics.cost.purchasePrice,
    intlShipping: economics.cost.intlShipping,
    domesticShipping: economics.cost.domesticShipping,
    importTax: economics.cost.importTax,
    platformFee: economics.cost.platformFee,
    packaging: economics.cost.packaging,
    other: economics.cost.other,
  };
}

export function ProfitSimulator({ detail }: { detail: ProductDetail }) {
  const { m } = useI18n();
  const p = m.productDetail;

  const [inputs, setInputs] = React.useState<SimInputs>(() => initialInputs(detail));

  const totalCost =
    inputs.purchasePrice +
    inputs.intlShipping +
    inputs.domesticShipping +
    inputs.importTax +
    inputs.platformFee +
    inputs.packaging +
    inputs.other;
  const estimatedProfit = inputs.sellPrice - totalCost;
  const marginRate = inputs.sellPrice > 0 ? estimatedProfit / inputs.sellPrice : 0;
  const roi = totalCost > 0 ? estimatedProfit / totalCost : 0;
  const profitPositive = estimatedProfit >= 0;

  const fields: { key: keyof SimInputs; label: string }[] = [
    { key: "sellPrice", label: p.sellPrice },
    { key: "purchasePrice", label: p.purchasePrice },
    { key: "intlShipping", label: p.intlShipping },
    { key: "domesticShipping", label: p.domesticShipping },
    { key: "importTax", label: p.importTax },
    { key: "platformFee", label: p.platformFee },
    { key: "packaging", label: p.packaging },
    { key: "other", label: p.other },
  ];

  function update(key: keyof SimInputs, raw: string) {
    const value = Number(raw);
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(value) && value >= 0 ? value : 0 }));
  }

  function resultValueClass(highlight: boolean): string {
    if (!highlight) return "font-semibold text-xl tabular-nums";
    if (profitPositive) return "font-semibold text-green-700 text-xl tabular-nums dark:text-green-300";
    return "font-semibold text-destructive text-xl tabular-nums";
  }

  const results = [
    { label: p.estimatedProfit, value: formatJpy(estimatedProfit), highlight: true },
    { label: p.margin, value: formatPercent(marginRate), highlight: false },
    { label: p.roi, value: formatPercent(roi), highlight: false },
    { label: p.breakEven, value: formatJpy(totalCost), highlight: false },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{m.simulator.title}</CardTitle>
        <CardDescription>{m.simulator.description}</CardDescription>
        <CardAction>
          <Button onClick={() => setInputs(initialInputs(detail))} size="sm" variant="ghost">
            <RotateCcw />
            {m.simulator.reset}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div className="flex flex-col gap-1.5" key={field.key}>
              <Label className="text-muted-foreground text-xs" htmlFor={`sim-${field.key}`}>
                {field.label}
              </Label>
              <Input
                className="tabular-nums"
                id={`sim-${field.key}`}
                inputMode="numeric"
                min={0}
                onChange={(event) => update(field.key, event.target.value)}
                type="number"
                value={inputs[field.key]}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {results.map((result) => (
            <div className="flex flex-col gap-1" key={result.label}>
              <span className="text-muted-foreground text-xs">{result.label}</span>
              <span className={resultValueClass(result.highlight)}>{result.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
