/**
 * Alerts のデータアクセス（STEP 18）。認証済みなら DB のアラートを取得してマッピング、
 * そうでなければサーバー算出のフォールバックを使う。
 */

"use client";

import { type AlertRecord, fetchAlertRecords } from "@/lib/api/alerts";

import type { Alert } from "./alerts";
import { productCatalog } from "./mock-data";
import type { TradeDirection } from "./types";

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nameFor(record: AlertRecord): string {
  const entry = record.productId ? productCatalog.find((e) => e.id === record.productId) : undefined;
  if (entry) return entry.name;
  return record.message?.split(":")[0]?.trim() ?? record.productId ?? "";
}

function mapRecord(record: AlertRecord): Alert | null {
  const id = record.productId ?? String(record.id);
  const payload = record.payload ?? {};

  if (record.kind === "opportunity") {
    const score = num(payload.score);
    return {
      kind: "opportunity",
      id,
      name: nameFor(record),
      direction: (payload.direction as TradeDirection | undefined) ?? "CN_TO_JP",
      scoreFrom: Math.max(0, score - 8),
      scoreTo: score,
      estimatedProfit: num(payload.estimatedProfit),
      reasons: [],
    };
  }

  if (record.kind === "season") {
    const peakMonth = num(payload.peakMonth, 1);
    return {
      kind: "season",
      id,
      name: nameFor(record),
      daysToPeak: num(payload.daysToPeak),
      recommendedBuyMonth: ((peakMonth - 2 + 11) % 12) + 1,
    };
  }

  return null;
}

/** DB のアラートを取得。未認証・失敗時は null（フォールバックを使う）。 */
export async function fetchDbAlerts(): Promise<Alert[] | null> {
  const records = await fetchAlertRecords();
  if (records === null) return null;
  return records.map(mapRecord).filter((a): a is Alert => a !== null);
}
