/**
 * Alerts（UI-011、docs/development_plan.md セクション 28, 65）向けのアラート生成。
 *
 * MVP では履歴データが無いため、現在のカタログから閾値ベースで商機アラートを
 * 決定論的に生成する。将来的にはスコア変化・価格変化の実績から生成する。
 */

import { deriveReasons } from "./economics";
import { mockOpportunities, productCatalog } from "./mock-data";
import { evaluate } from "./opportunity-engine";
import { getSeasonalOpportunities } from "./seasonal";
import type { ReasonCode, TradeDirection } from "./types";

/** Score 上昇の商機アラート。 */
export interface OpportunityAlert {
  kind: "opportunity";
  id: string;
  name: string;
  direction: TradeDirection;
  scoreFrom: number;
  scoreTo: number;
  estimatedProfit: number;
  reasons: ReasonCode[];
}

/** 季節需要接近アラート。 */
export interface SeasonAlert {
  kind: "season";
  id: string;
  name: string;
  daysToPeak: number;
  recommendedBuyMonth: number;
}

export type Alert = OpportunityAlert | SeasonAlert;

/** Score 上昇アラートとみなす下限（backend monitoring.ALERT_SCORE と一致）。 */
const ALERT_SCORE = 60;
/** 季節アラートを出す残り日数の上限。 */
const SEASON_ALERT_DAYS = 60;

/** 現在のデータから商機アラートを生成する（Score 高い順・ピーク近い順）。 */
export function getAlerts(): Alert[] {
  const opportunityAlerts: OpportunityAlert[] = mockOpportunities
    .filter((o) => o.score >= ALERT_SCORE)
    .sort((a, b) => b.score - a.score)
    .map((o) => {
      const entry = productCatalog.find((e) => e.id === o.id);
      const best = entry ? evaluate(entry).best : null;
      const reasons = entry && best ? deriveReasons(entry, best.direction, best.economics) : [];
      return {
        kind: "opportunity" as const,
        id: o.id,
        name: o.name,
        direction: o.bestDirection,
        // 直近の上昇を模した表示用の変化量（Score - 8 を過去値とみなす）。
        scoreFrom: Math.max(0, o.score - 8),
        scoreTo: o.score,
        estimatedProfit: o.estimatedProfit,
        reasons: reasons.slice(0, 3),
      };
    });

  const seasonAlerts: SeasonAlert[] = getSeasonalOpportunities()
    .filter((item) => item.daysToPeak <= SEASON_ALERT_DAYS)
    .map((item) => ({
      kind: "season" as const,
      id: item.id,
      name: item.name,
      daysToPeak: item.daysToPeak,
      recommendedBuyMonth: item.recommendedBuyMonth,
    }));

  return [...opportunityAlerts, ...seasonAlerts];
}
