/**
 * AI エージェント（Category Agent / Product Discovery）のフロント側クライアント。
 * API が有効なら /categories/decompose を呼び、未設定・到達不能時はルールベースの
 * フォールバック（バックエンドの既知ツリーを反映）を返す。
 */

import { apiPost, isApiEnabled } from "@/lib/api/client";

export interface SubCategory {
  name: string;
  productTypes: string[];
}

export interface CategoryTree {
  category: string;
  subCategories: SubCategory[];
  /** 生成元。"ai" = LLM 生成 / "rule" = ルールベース。 */
  source: string;
}

// バックエンド app/agents/category_agent.py の _RULE_TREES を反映したフォールバック。
const RULE_TREES: Record<string, SubCategory[]> = {
  キャンプ用品: [
    { name: "テント", productTypes: ["ソロテント", "2人用テント", "ファミリーテント", "ワンタッチテント"] },
    { name: "調理器具", productTypes: ["クッカー", "バーナー", "ケトル", "ホットサンドメーカー"] },
    { name: "椅子・テーブル", productTypes: ["ローチェア", "折りたたみチェア", "キャンプテーブル"] },
    { name: "ランタン", productTypes: ["LEDランタン", "USBランタン", "ガスランタン"] },
    { name: "寝具", productTypes: ["シュラフ", "マット", "枕"] },
  ],
};

function fallbackTree(category: string): CategoryTree {
  const subCategories = RULE_TREES[category] ?? [{ name: category, productTypes: [`${category} 一般`] }];
  return { category, subCategories, source: "rule" };
}

/** カテゴリーを分解する。API 優先・失敗時はルールベース。 */
export async function decomposeCategory(category: string): Promise<CategoryTree> {
  const trimmed = category.trim();
  if (trimmed.length === 0) {
    return { category: trimmed, subCategories: [], source: "rule" };
  }
  if (isApiEnabled()) {
    try {
      return await apiPost<CategoryTree>("/categories/decompose", { category: trimmed });
    } catch {
      // フォールバック。
    }
  }
  return fallbackTree(trimmed);
}
