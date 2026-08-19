/**
 * UI 表示言語。日本語 / 中国語（簡体）を切り替える。
 * docs/development_plan.md の越境（日中）コンセプトに合わせ 2 言語を提供する。
 */
export const LOCALE_VALUES = ["ja", "zh"] as const;

export type Locale = (typeof LOCALE_VALUES)[number];
