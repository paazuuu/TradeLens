/**
 * ユーザー設定（UI-012、docs/development_plan.md セクション 66）。
 *
 * MVP では Backend を持たないため、クライアントの localStorage に保存する。
 * 為替・コスト・閾値・通知・監視頻度を保持し、将来的に Profit Engine や
 * Watchlist スケジューラの既定値として参照する。
 */

export type MonitorFrequency = "daily" | "weekly" | "monthly";

export interface UserSettings {
  /** 為替レート CNY→JPY（1 元あたりの円）。 */
  exchangeRate: number;
  /** 既定の国際送料（円）。 */
  intlShipping: number;
  /** 既定の国内送料（円）。 */
  domesticShipping: number;
  /** 関税・輸入諸税の率（%）。 */
  importTaxRate: number;
  /** 販売プラットフォーム手数料率（%）。 */
  platformFeeRate: number;
  /** 最低利益率（%）。 */
  minMargin: number;
  /** 最低 Opportunity Score。 */
  minScore: number;
  /** メールアラートの有効/無効。 */
  emailAlerts: boolean;
  /** 監視頻度。 */
  monitorFrequency: MonitorFrequency;
}

export const SETTINGS_STORAGE_KEY = "crossborder_settings";

export const DEFAULT_SETTINGS: UserSettings = {
  exchangeRate: 21,
  intlShipping: 1600,
  domesticShipping: 700,
  importTaxRate: 5,
  platformFeeRate: 10,
  minMargin: 20,
  minScore: 70,
  emailAlerts: true,
  monitorFrequency: "weekly",
};

const FREQUENCIES: MonitorFrequency[] = ["daily", "weekly", "monthly"];

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** localStorage の生文字列を安全に UserSettings へ変換する（不正値は既定値へフォールバック）。 */
export function parseSettings(raw: string | null): UserSettings {
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      exchangeRate: toNumber(parsed.exchangeRate, DEFAULT_SETTINGS.exchangeRate),
      intlShipping: toNumber(parsed.intlShipping, DEFAULT_SETTINGS.intlShipping),
      domesticShipping: toNumber(parsed.domesticShipping, DEFAULT_SETTINGS.domesticShipping),
      importTaxRate: toNumber(parsed.importTaxRate, DEFAULT_SETTINGS.importTaxRate),
      platformFeeRate: toNumber(parsed.platformFeeRate, DEFAULT_SETTINGS.platformFeeRate),
      minMargin: toNumber(parsed.minMargin, DEFAULT_SETTINGS.minMargin),
      minScore: toNumber(parsed.minScore, DEFAULT_SETTINGS.minScore),
      emailAlerts: typeof parsed.emailAlerts === "boolean" ? parsed.emailAlerts : DEFAULT_SETTINGS.emailAlerts,
      monitorFrequency:
        parsed.monitorFrequency && FREQUENCIES.includes(parsed.monitorFrequency)
          ? parsed.monitorFrequency
          : DEFAULT_SETTINGS.monitorFrequency,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
