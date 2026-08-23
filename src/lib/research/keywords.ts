/**
 * 中日市場のキーワード差分析（Phase 2、docs/development_plan.md セクション 41）。
 *
 * backend/app/keywords.py と同一の抽出・集計を移植し、API 未接続のモックでも同じ
 * キーワード差を返す（整合性の原則: セクション 93）。文字 n-gram はコードポイント単位で
 * 一致するため、日本語（BMP）で Python と結果が揃う。
 */

import { pyRound } from "./history";
import type { KeywordBias, KeywordGap, MarketSnapshot, ProductCatalogEntry } from "./types";

const MIN_LEN = 3;
const MAX_LEN = 5;
const MIN_DOC_FREQ = 2;
const BIAS_THRESHOLD = 8;
const MAX_KEYWORDS = 12;

function clean(name: string): string {
  return name.replace(/ /g, "").replace(/　/g, "");
}

function substrings(name: string): Set<string> {
  const cleaned = clean(name);
  const result = new Set<string>();
  for (let size = MIN_LEN; size <= MAX_LEN; size++) {
    for (let start = 0; start <= cleaned.length - size; start++) {
      result.add(cleaned.slice(start, start + size));
    }
  }
  return result;
}

function documentFrequencies(entries: ProductCatalogEntry[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const entry of entries) {
    for (const sub of substrings(entry.name)) {
      freq.set(sub, (freq.get(sub) ?? 0) + 1);
    }
  }
  return freq;
}

/** 文字列の辞書順比較（-1/0/1）。 */
function compareStr(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function extractKeywords(entries: ProductCatalogEntry[]): string[] {
  const freq = documentFrequencies(entries);
  const candidates = [...freq.entries()].filter(([, count]) => count >= MIN_DOC_FREQ).map(([sub]) => sub);
  // 長い順・辞書順で走査し、同頻度でより長い採用済み語に含まれる短い語は捨てる。
  candidates.sort((a, b) => (a.length !== b.length ? b.length - a.length : compareStr(a, b)));
  const kept: string[] = [];
  for (const candidate of candidates) {
    const redundant = kept.some(
      (k) => k.includes(candidate) && freq.get(k) === freq.get(candidate) && k.length > candidate.length,
    );
    if (!redundant) kept.push(candidate);
  }
  return kept;
}

function sideStrength(snap: MarketSnapshot): number {
  const reviewScore = Math.min(100, snap.reviewCount / 20);
  const competitionPenalty = Math.min(30, snap.competitors * 0.15);
  const raw = snap.demandIndex * 0.7 + reviewScore * 0.3 - competitionPenalty;
  return Math.max(0, Math.min(100, raw));
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function biasOf(gap: number): KeywordBias {
  if (gap >= BIAS_THRESHOLD) return "jp";
  if (gap <= -BIAS_THRESHOLD) return "cn";
  return "balanced";
}

/** キーワードごとの日中市場強度差を、差の大きい順に返す。 */
export function keywordGaps(entries: ProductCatalogEntry[]): KeywordGap[] {
  const keywords = extractKeywords(entries);
  const gaps: KeywordGap[] = [];
  for (const keyword of keywords) {
    const matched = entries.filter((e) => clean(e.name).includes(keyword));
    if (matched.length === 0) continue;
    const jpStrength = pyRound(mean(matched.map((e) => sideStrength(e.japan))));
    const cnStrength = pyRound(mean(matched.map((e) => sideStrength(e.china))));
    const gap = jpStrength - cnStrength;
    gaps.push({ keyword, productCount: matched.length, jpStrength, cnStrength, gap, bias: biasOf(gap) });
  }

  gaps.sort((a, b) => {
    if (Math.abs(a.gap) !== Math.abs(b.gap)) return Math.abs(b.gap) - Math.abs(a.gap);
    if (a.productCount !== b.productCount) return b.productCount - a.productCount;
    return compareStr(a.keyword, b.keyword);
  });
  return gaps.slice(0, MAX_KEYWORDS);
}
