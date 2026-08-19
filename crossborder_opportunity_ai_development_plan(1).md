# 日中越境商品リサーチAI — 開発計画書

## 1. プロジェクト概要

### 目的

「検索したい商品カテゴリー」を入力するだけで、AIが日本市場と中国市場を横断して商品機会を調査し、

- 日本 → 中国
- 中国 → 日本
- 季節商品
- 通年商品
- 価格差
- 推定利益
- 需要
- 競合
- 仕入れ難易度
- 商品の類似度
- 市場トレンド

を分析し、**今どの商品に商機があるのか**をBIダッシュボードで可視化する。

単純な「価格比較サービス」ではなく、最終的には

> **AI越境商品リサーチャー**

として、ユーザーが「何を仕入れて、どちらの市場で販売すると可能性があるか」を判断できるシステムを目指す。

---

# 2. 基本コンセプト

## 2.1 一般的な価格比較

```text
商品A
日本 ¥10,000
中国 ¥5,000
```

だけでは不十分。

## 2.2 本システム

```text
カテゴリー
    ↓
AIカテゴリー分解
    ↓
具体的商品候補生成
    ↓
日本市場調査
    ↓
中国市場調査
    ↓
同一商品・類似商品のマッチング
    ↓
為替換算
    ↓
送料・税・手数料等を考慮
    ↓
推定利益計算
    ↓
需要・競合・季節性分析
    ↓
Opportunity Score
    ↓
日本→中国 / 中国→日本を判定
    ↓
BI Dashboard
```

---

# 3. 対象となる商流

本システムでは最初から方向を固定しない。

## 3.1 日本 → 中国

```text
日本で仕入れ
    ↓
中国で販売
```

評価項目:

- 日本仕入価格
- 中国販売価格
- 中国での需要
- 中国競合
- 国際送料
- 関税・税金等
- 販売手数料
- 推定利益
- 利益率
- 中国市場での成長性

---

## 3.2 中国 → 日本

```text
中国で仕入れ
    ↓
日本で販売
```

評価項目:

- 中国仕入価格
- 日本販売価格
- 日本需要
- 日本競合
- 国際送料
- 関税・税金等
- 販売手数料
- 推定利益
- 利益率
- 日本市場での成長性

---

## 3.3 双方向チャンス

同じ商品について、

```text
日本 → 中国
```

と

```text
中国 → 日本
```

を両方評価する。

市場によって価格差が逆転する可能性があるため、方向をAIに固定させない。

---

# 4. カテゴリー入力

ユーザーは大まかなカテゴリーだけを入力できる。

例:

```text
キャンプ用品
美容用品
キッチン用品
ペット用品
文房具
DIY用品
家電
スポーツ用品
ベビー用品
自動車用品
```

---

# 5. AIによるカテゴリー分解

例:

```text
キャンプ用品
├── テント
│   ├── ソロテント
│   ├── 2人用テント
│   ├── ファミリーテント
│   └── ワンタッチテント
│
├── 調理器具
│   ├── クッカー
│   ├── バーナー
│   ├── ケトル
│   └── ホットサンドメーカー
│
├── 椅子・テーブル
│   ├── ローチェア
│   ├── 折りたたみチェア
│   └── キャンプテーブル
│
└── ランタン
    ├── LEDランタン
    ├── USBランタン
    └── ガスランタン
```

AIはカテゴリーを複数階層まで展開する。

---

# 6. 商品候補の生成

カテゴリーだけではなく、具体的な商品タイプまで取得する。

```text
カテゴリー
↓
サブカテゴリー
↓
商品タイプ
↓
ブランド
↓
モデル
↓
SKU / 型番 / JAN等
```

ただし、ブランド商品とノーブランド/OEM商品は区別する。

---

# 7. 商品マッチング

日本商品と中国商品を比較する際、単純な商品名一致を使わない。

## マッチング項目

- 商品名
- ブランド
- 型番
- SKU
- JAN
- サイズ
- 重量
- 材質
- カラー
- 仕様
- 商品説明
- 商品画像
- JAN/EAN等の識別子
- AIによる意味的類似度

## マッチタイプ

```text
EXACT
完全一致

BRAND_MATCH
同一ブランド

MODEL_MATCH
同一モデル

SIMILAR
高類似商品

OEM_CANDIDATE
OEM候補

UNMATCHED
比較対象なし
```

---

# 8. 価格比較

すべての価格に取得日時を持たせる。

```text
日本価格
¥12,800
取得日時: 2026-08-19 10:30

中国価格
¥5,200相当
取得日時: 2026-08-19 10:35
```

価格は複数販売先から取得し、

- 最安価格
- 中央値
- 平均価格
- 代表価格

を管理する。

単一店舗の価格だけで商機判定しない。

---

# 9. 為替

CNY/JPY等の為替を定期取得する。

価格計算には、

```text
現在レート
一定期間平均レート
保守的レート
```

を持たせる。

為替変動によって利益が大きく変わる商品は、リスク評価を下げる。

---

# 10. 実質利益計算

単純な販売価格－仕入価格ではなく、総コストを計算する。

## 基本式

```text
販売価格
－ 仕入価格
－ 国際送料
－ 国内送料
－ 関税・税金等
－ 決済手数料
－ 販売プラットフォーム手数料
－ 梱包費
－ その他想定コスト
＝ 推定利益
```

## 指標

- 推定利益額
- 利益率
- ROI
- 損益分岐価格
- 最大許容仕入価格

---

# 11. Opportunity Score

商品を単純な価格差ではなく、総合評価する。

## 初期スコア案

| 指標 | 重み |
|---|---:|
| 推定利益率 | 25% |
| 推定利益額 | 20% |
| 市場需要 | 15% |
| 価格差 | 10% |
| 競合の少なさ | 10% |
| 仕入れ安定性 | 5% |
| 季節性 | 5% |
| 商品リスク | 5% |
| 価格・為替安定性 | 5% |

合計:

```text
100%
```

重みは運用データを蓄積した後に最適化する。

---

# 12. 商流方向の自動判定

各商品について、

```text
Japan → China Score
China → Japan Score
```

を別々に計算する。

例:

```text
商品A

日本→中国
Score: 91
推定利益: ¥4,800

中国→日本
Score: 64
推定利益: ¥1,900

判定:
日本→中国が有望
```

別の商品では逆になる。

---

# 13. 季節商品分析

本システムの重要機能として季節性を導入する。

## 季節カテゴリー例

### 春

- 新生活用品
- 花粉・アレルギー対策関連
- 入学・通学用品
- アウトドア用品
- 園芸用品

### 夏

- 冷感用品
- 水遊び用品
- アウトドア用品
- BBQ用品
- UV対策用品
- 旅行用品

### 秋

- 防寒準備用品
- キャンプ用品
- ハロウィン関連
- スポーツ用品
- 収納用品

### 冬

- 防寒用品
- 加湿関連
- クリスマス用品
- 年末年始用品
- スキー・スノーボード関連

---

# 14. 国ごとの季節差

日本と中国では季節需要が完全には一致しない。

したがって、

```text
日本の季節
中国の季節
```

を別々に管理する。

例:

```text
日本:
夏需要 ↑

中国:
別地域では需要時期が異なる
```

この差を利用して商機を発見する。

---

# 15. 季節商品の先行予測

「今売れている商品」だけでは遅い。

例えば、

```text
9月
↓
10月需要増加予測
↓
11月ピーク
```

なら、

```text
8月〜9月
仕入れ候補
```

として表示する。

## Dashboard

```text
🔥 30〜60日後に需要増加予測

商品A
現在Score: 82
予測Score: 94

推奨:
今から仕入れ検討
```

---

# 16. トレンド分析

過去データから、

- 検索需要
- 販売価格
- 商品数
- レビュー増加
- 出品者数
- 売れ筋ランキング等、利用可能な指標
- SNS/検索トレンド等、利用可能なデータ

を分析する。

目的は、

```text
現在売れている
```

だけではなく、

```text
これから売れそう
```

を発見すること。

---

# 17. 「価格差はあるが仕入れない方がいい商品」の判定

これは必須。

例:

```text
日本販売価格
¥20,000

中国仕入価格
¥5,000
```

でも、

```text
国際送料 ¥6,000
税等       ¥2,000
手数料     ¥4,000
```

なら利益がほとんどない。

したがって、

```text
価格差あり
≠
商機あり
```

とする。

---

# 18. 商品リスク

以下の商品はリスク評価を下げる。

- 法規制が複雑
- 輸入規制対象
- サイズが大きい
- 重量が大きい
- 壊れやすい
- 偽物リスクが高い
- ブランド権利リスク
- 安全基準対応が必要
- 電池・電気関連の規制
- 食品・化粧品等の規制
- 医療関連
- 危険物
- 販売許可が必要なカテゴリー

最終的な販売可否はAIだけで断定せず、対象国の法令・税関・販売プラットフォーム規約等を確認できる設計にする。

---

# 19. BI Dashboard

## Dashboard 1 — Overview

```text
検索カテゴリー

キャンプ用品

商品候補数
1,284

有望商品
87

日本→中国
42

中国→日本
45

季節商品
31
```

---

# 20. Dashboard 2 — Opportunity Ranking

```text
Rank | 商品 | 方向 | Score | 利益 | 利益率
------------------------------------------------
1    | 商品A | 中→日 | 96 | ¥5,200 | 38%
2    | 商品B | 日→中 | 94 | ¥4,800 | 35%
3    | 商品C | 中→日 | 92 | ¥4,100 | 32%
```

フィルター:

- カテゴリー
- 国方向
- Score
- 利益率
- 季節
- ブランド
- OEM
- 商品サイズ
- リスク
- 価格帯

---

# 21. Dashboard 3 — Product Detail

```text
商品画像

商品名
ブランド
型番

日本市場
販売価格
販売店
レビュー
競合数

中国市場
販売価格
販売店
レビュー
競合数

--------------------------------

仕入価格
送料
税等
手数料
総コスト

販売価格
推定利益
利益率

--------------------------------

Opportunity Score
```

---

# 22. Dashboard 4 — Market Direction

2方向を比較する。

```text
商品A

日本→中国
██████████████████ 91

中国→日本
███████████ 63
```

カテゴリー単位でも表示する。

```text
カテゴリー別

日本→中国が有利
中国→日本が有利
両方向
商機なし
```

---

# 23. Dashboard 5 — Seasonal Opportunity

```text
今月おすすめ

🔥 30日以内に需要増加
🟢 60日以内に需要増加
🟡 90日以内に需要増加
```

表示内容:

- 商品
- 予測需要
- 現在価格
- 予想価格
- 予想利益
- ピーク時期
- 推奨仕入れ時期
- Score

---

# 24. Dashboard 6 — Price History

商品ごとに、

```text
日本価格
中国価格
為替
利益率
```

の推移を表示する。

これによって、

```text
一時的な価格差
```

と

```text
継続的な価格差
```

を区別する。

---

# 25. AIリサーチ画面

検索画面は単純なフォームにする。

```text
-----------------------------------------
AI商品リサーチ
-----------------------------------------

何を探しますか？

[ キャンプ用品                    ]

対象:
☑ 日本→中国
☑ 中国→日本

☑ 季節商品を含める
☑ OEM候補を含める
☑ 類似商品を含める

最低利益率:
[ 20% ]

最低Opportunity Score:
[ 70 ]

[ AIリサーチ開始 ]
-----------------------------------------
```

---

# 26. AIリサーチ結果

AIが処理状況を表示する。

```text
✓ カテゴリー解析
✓ サブカテゴリー生成
✓ 商品候補取得
✓ 日本市場調査
✓ 中国市場調査
✓ 商品マッチング
✓ 為替換算
✓ コスト計算
✓ 季節性分析
✓ Opportunity Score計算

完了

1,284商品を分析しました。
87商品が有望候補です。
```

---

# 27. 通知機能

ユーザーがカテゴリーを保存できる。

例:

```text
監視カテゴリー

キャンプ用品
美容用品
ペット用品
キッチン用品
```

毎日または指定頻度で再調査。

---

# 28. 商機アラート

例:

```text
🔥 新しい商機

商品:
○○

方向:
中国 → 日本

Opportunity Score:
78 → 94

理由:
・中国価格 -12%
・日本販売価格 +8%
・需要 +21%
・競合 -7%

推定利益:
¥4,800
```

---

# 29. システム構成

```text
Frontend
Next.js
React
Tailwind CSS
shadcn/ui

        ↓

Backend API
FastAPI

        ↓

AI Layer
LLM
Category Agent
Product Matching Agent
Profit Agent
Seasonality Agent
Risk Agent

        ↓

Data Collection Layer
各市場のAPI
許可されたデータ提供手段
データインポート

        ↓

Normalization
商品名正規化
通貨変換
単位変換
価格正規化

        ↓

Matching Engine
Exact Match
Semantic Match
Image Match
SKU/JAN/Model Match

        ↓

PostgreSQL
商品
価格
カテゴリー
市場
為替
履歴
スコア

        ↓

Search Engine
OpenSearch / Elasticsearch

        ↓

BI
Apache Superset / Metabase
または
Next.js内製Dashboard
```

---

# 30. AI Agent構成

AIを1個だけ使わない。

## Category Agent

カテゴリーを分解。

## Product Discovery Agent

具体的商品候補を発見。

## Matching Agent

日本商品と中国商品を比較。

## Pricing Agent

価格を正規化。

## Profit Agent

利益計算。

## Seasonality Agent

季節性分析。

## Trend Agent

市場トレンド分析。

## Risk Agent

規制・販売リスクの確認候補を提示。

## Opportunity Agent

最終スコアを作成。

---

# 31. MVP開発順序

## MVP-01

### 商品カテゴリー入力

実装:

- カテゴリー入力
- AIカテゴリー分解
- サブカテゴリー表示

完成条件:

```text
キャンプ用品
↓
10〜50程度の商品タイプ
```

を生成できる。

---

# 32. MVP-02

### 商品データ収集

最初は利用可能な正規API・データソースを少数に限定する。

目的:

```text
日本商品
中国商品
```

をデータベースへ保存できる状態にする。

---

# 33. MVP-03

### 商品マッチング

実装:

- 商品名
- 型番
- JAN等
- ブランド
- 仕様
- AI類似度

を組み合わせる。

出力:

```text
MATCH SCORE
```

---

# 34. MVP-04

### 為替・価格差

実装:

```text
JPY
CNY
```

の変換。

価格差:

```text
差額
差額率
```

を計算。

---

# 35. MVP-05

### 利益計算

送料・税等・手数料を設定可能にする。

ユーザーが、

```text
送料
手数料
販売価格
```

を変更できるようにする。

---

# 36. MVP-06

### Opportunity Score

最初のルールベースモデルを作る。

AIだけに完全依存しない。

```text
Score =
利益
需要
価格差
競合
リスク
季節性
```

から算出。

---

# 37. MVP-07

### BI Dashboard

最低限:

1. Overview
2. Opportunity Ranking
3. Product Detail
4. Direction Analysis

を実装。

---

# 38. MVP-08

### 季節性

実績データが十分でなくても、

- 月
- 季節
- イベント
- 国別需要時期

をルールベースで開始。

データ蓄積後に機械学習へ移行。

---

# 39. MVP-09

### 自動監視

保存カテゴリーを定期的に再調査。

```text
Daily
Weekly
Monthly
```

を選択可能にする。

---

# 40. MVP-10

### アラート

条件:

```text
Score > 90
利益率 > 30%
価格差 > 50%
```

など。

通知:

- Dashboard
- Email
- 将来的にはLINE/Discord等

---

# 41. Phase 2

MVP完成後に追加:

- トレンド予測
- 需要予測
- 価格予測
- OEM候補
- 類似商品探索
- ブランド分析
- 競合分析
- 商品画像比較
- レビュー分析
- 中国市場と日本市場のキーワード差分析

---

# 42. Phase 3

将来的には、

```text
AI商品リサーチ
       ↓
仕入れ候補
       ↓
仕入れ先候補
       ↓
販売市場
       ↓
販売価格
       ↓
利益予測
       ↓
商品登録支援
```

まで拡張する。

ただし、発注や販売などの自動実行は、ユーザーの承認を必須とする。

---

# 43. 重要な設計原則

## 原則1

価格差だけで商品を推薦しない。

## 原則2

日本→中国と中国→日本を同時評価する。

## 原則3

現在売れている商品だけではなく、これから需要が増える商品を探す。

## 原則4

季節性を国別に扱う。

## 原則5

利益計算は総コストベース。

## 原則6

データには取得日時を必ず保存。

## 原則7

商品マッチングの信頼度を表示。

## 原則8

規制・知財・販売可否をAIが断定しない。

## 原則9

データ取得元の利用規約・API条件を遵守する。

## 原則10

AIの判断理由をユーザーに説明する。

---

# 44. 最終的なユーザー体験

ユーザーは、

```text
「キャンプ用品」
```

と入力するだけ。

システムは、

```text
カテゴリー分析
↓
商品候補
↓
日本市場
↓
中国市場
↓
商品マッチング
↓
価格比較
↓
送料・税・手数料
↓
利益計算
↓
季節性
↓
需要
↓
競合
↓
リスク
↓
Opportunity Score
```

まで自動処理。

最終的に、

```text
🔥 今おすすめの商品

1位
中国 → 日本

商品A
Score 96
推定利益 ¥5,200
利益率 38%

理由:
・中国仕入価格が低い
・日本販売価格が安定
・競合が少ない
・需要上昇中
・2か月後に季節需要ピーク
```

という形で提示する。

---

# 45. 最終ゴール

最終的には、

> **「何を売ればいいか分からない」**

という状態から、

> **「この商品を、この国から、この国へ、この価格で販売すると、これくらいの利益機会がある」**

までAIが整理する。

さらに、

> **「今ではなく、○月から需要が伸びるので、○月までに仕入れを検討すべき」**

まで提示する。

この方向性を本プロジェクトの最終コンセプトとする。

---

# 46. 推奨プロジェクト名

仮称:

**CrossBorder Opportunity AI**

日本語:

**日中越境商品リサーチAI**

コンセプト:

> **価格差を探すAIではなく、越境ビジネスの「商機」を探すAI。**

---

# 47. 開発開始時の最優先タスク

最初に作るべきものは、巨大なスクレイピングシステムではない。

以下の小さな垂直スライスを完成させる。

```text
「キャンプ用品」
      ↓
AIカテゴリー分解
      ↓
商品候補10〜30件
      ↓
日本データ
      ↓
中国データ
      ↓
商品マッチング
      ↓
為替
      ↓
簡易利益計算
      ↓
Opportunity Score
      ↓
ランキング画面
```

これを1カテゴリーで最後まで動かす。

その後、

```text
データソース追加
↓
カテゴリー追加
↓
季節性
↓
価格履歴
↓
需要分析
↓
自動監視
↓
アラート
```

の順に拡張する。

**最初から「全市場・全カテゴリー」を作らず、1カテゴリー・1方向・数十商品でEnd-to-Endを完成させることを最優先とする。**


---

# 48. UI実装方針 — GitHub土台の採用

## 採用するUIベース

本プロジェクトのUI土台として、以下のOSSを採用する。

**arhamkhnz/next-shadcn-admin-dashboard**

GitHub:
https://github.com/arhamkhnz/next-shadcn-admin-dashboard

2026年8月時点で、リポジトリはNext.js 16、TypeScript、Tailwind CSS v4、Shadcn UIを採用し、Zod、React Hook Form、Zustand、TanStack Table、Biome、Huskyも利用している。

また、Default / CRM / Finance / Analytics / Productivity / E-commerce / Logistics / Infrastructure等の複数Dashboard、認証画面、ユーザー管理、Roles、Kanban、Tasks、Invoice、Calendar等の画面が用意されている。

ライセンスはMIT。

このため、本プロジェクトではUIをゼロから作らず、

```text
next-shadcn-admin-dashboard
        ↓
不要な画面を整理
        ↓
越境商品リサーチ用のナビゲーションへ変更
        ↓
AI Research
Opportunity
Products
Seasonal
Markets
Analytics
Settings
を追加
```

という方針にする。

参照:
https://github.com/arhamkhnz/next-shadcn-admin-dashboard

---

# 49. UIの基本方針

本プロジェクトは「EC管理画面」ではなく、

> AI商品リサーチSaaS + BI Dashboard

として設計する。

したがって、一般的な管理画面の大量のメニューをそのまま残さない。

ユーザーが最初に知りたい情報を優先する。

```text
今日どの商品に商機があるか？
        ↓
どちらの方向が有利か？
        ↓
いくら利益が出そうか？
        ↓
なぜ有望なのか？
        ↓
いつ仕入れるべきか？
```

---

# 50. 推奨ナビゲーション

```text
Dashboard
│
├── AI Research
│
├── Opportunities
│
├── Products
│
├── Seasonal
│
├── Markets
│
├── Analytics
│
├── Watchlists
│
└── Settings
```

## Dashboard

今日の商機を表示。

## AI Research

カテゴリーを入力してAI調査を開始。

## Opportunities

Opportunity Score順のランキング。

## Products

調査済み商品データベース。

## Seasonal

季節商品と需要予測。

## Markets

日本市場と中国市場の比較。

## Analytics

価格・利益・需要・カテゴリー分析。

## Watchlists

ユーザーが保存したカテゴリー・商品を監視。

## Settings

コスト、送料、為替、通知等を設定。

---

# 51. 既存テンプレートから再利用するもの

以下は可能な限り既存コンポーネントを再利用する。

```text
Sidebar
Header
Theme Switcher
Dashboard Layout
Card
Tabs
Dialog
Dropdown
Select
Input
Form
Table
Pagination
Badge
Avatar
Tooltip
Command
Sheet
Breadcrumb
Calendar
```

特にTanStack Tableは商品ランキング・商品一覧で活用する。

---

# 52. 既存Dashboardの転用方針

## Analytics Dashboard

以下に転用。

```text
価格差分析
利益率分析
市場分析
価格推移
カテゴリー分析
```

## E-commerce Dashboard

以下に転用。

```text
商品数
売れ筋
商品ランキング
カテゴリー別商品
```

## Finance Dashboard

以下に転用。

```text
推定利益
利益率
ROI
コスト
為替
```

## CRM Dashboard

以下に転用。

```text
Watchlist
保存商品
調査履歴
アラート
```

---

# 53. 独自に作るUI

既存テンプレートだけでは本サービスの価値を表現できないため、以下は独自実装する。

```text
AI Research
Opportunity Score
Japan ↔ China Direction
Seasonal Opportunity
Product Match
Profit Simulator
Market Intelligence
AI Explanation
```

---

# 54. 画面一覧

| ID | 画面 | MVP | 目的 |
|---|---|---|---|
| UI-001 | Dashboard | Yes | 全体状況 |
| UI-002 | AI Research | Yes | 商品調査 |
| UI-003 | Research Progress | Yes | AI処理状況 |
| UI-004 | Opportunity Ranking | Yes | 有望商品ランキング |
| UI-005 | Product Detail | Yes | 商品詳細 |
| UI-006 | Profit Simulator | Yes | 利益シミュレーション |
| UI-007 | Markets | Yes | 日中市場比較 |
| UI-008 | Seasonal | Phase 2 | 季節商品 |
| UI-009 | Analytics | Phase 2 | 詳細分析 |
| UI-010 | Watchlists | Phase 2 | 自動監視 |
| UI-011 | Alerts | Phase 2 | 商機通知 |
| UI-012 | Settings | Yes | ユーザー設定 |

---

# 55. UI-001 Dashboard

## 目的

ログイン後に「今日見るべき情報」を一画面で把握する。

## 上部KPI

```text
調査商品数
有望商品数
日本→中国
中国→日本
季節商品
平均利益率
```

## メイン

```text
🔥 Top Opportunities
```

## 下部

```text
価格差Top
利益率Top
需要上昇Top
季節先取りTop
```

---

# 56. UI-002 AI Research

## 入力

```text
カテゴリー
```

## オプション

```text
日本→中国
中国→日本
両方向

季節商品
OEM
類似商品

最低利益率
最低Score
商品価格帯
```

## 実行

```text
AI Research
```

---

# 57. UI-003 Research Progress

AI処理を段階表示する。

```text
✓ Category Analysis
✓ Product Discovery
✓ Japan Market
✓ China Market
✓ Product Matching
✓ FX Conversion
✓ Cost Calculation
✓ Seasonality
✓ Opportunity Score
```

最後に、

```text
1,284 products analyzed
87 opportunities found
```

を表示。

---

# 58. UI-004 Opportunity Ranking

## テーブル列

```text
Rank
Image
Product
Category
Direction
Japan Price
China Price
Price Gap
Estimated Profit
Margin
Seasonality
Risk
Score
```

## フィルター

```text
Category
Direction
Score
Margin
Season
Risk
Brand
OEM
```

---

# 59. UI-005 Product Detail

## 上部

```text
商品画像
商品名
ブランド
型番
Match Score
Opportunity Score
```

## 中央

```text
🇯🇵 Japan
販売価格
競合
需要

🇨🇳 China
販売価格
競合
需要
```

## 下部

```text
仕入価格
送料
税等
手数料
推定利益
利益率
ROI
```

## AI説明

```text
なぜこの商品が有望なのか
```

---

# 60. UI-006 Profit Simulator

ユーザーが数字を変更できる。

```text
仕入価格
販売価格
為替
国際送料
国内送料
関税等
販売手数料
その他費用
```

リアルタイムで、

```text
推定利益
利益率
ROI
損益分岐点
```

を更新。

---

# 61. UI-007 Markets

## 比較

```text
Japan
China
```

カテゴリー別に、

```text
平均価格
中央値
競合
需要
価格推移
Opportunity
```

を比較。

---

# 62. UI-008 Seasonal

## 重要情報

```text
現在
↓
需要増加開始
↓
ピーク
↓
需要減少
```

## 表示

```text
商品
ピーク時期
推奨仕入時期
予測Score
現在Score
予測需要
```

---

# 63. UI-009 Analytics

既存Analytics Dashboardをベースにする。

追加するチャート:

```text
価格差推移
利益率推移
日本→中国 vs 中国→日本
カテゴリー別Opportunity
季節性
価格分布
利益分布
```

---

# 64. UI-010 Watchlists

ユーザーが、

```text
キャンプ用品
美容用品
ペット用品
```

などを保存。

商品単位でも、

```text
商品A
商品B
商品C
```

を監視できる。

---

# 65. UI-011 Alerts

例:

```text
🔥 Score 90突破

商品A

Score
84 → 93

理由
日本価格 +8%
中国価格 -12%
需要 +21%
```

また、

```text
🌱 季節需要接近

商品B

需要ピークまで45日
推奨調査日: 今週
```

---

# 66. UI-012 Settings

```text
基本通貨
為替
送料
税等
販売手数料
最低利益率
最低Opportunity Score
通知
監視頻度
```

---

# 67. 開発工程

## STEP 0 — Repository固定

### 作業

```text
next-shadcn-admin-dashboard
```

をForkまたは新規プロジェクトとして採用。

### 完了条件

```text
npm install
npm run dev
```

でローカル起動。

### 注意

採用時点の最新ブランチを確認し、依存関係とライセンスを確認する。

---

# 68. STEP 1 — UIテンプレート整理

### 作業

既存Dashboardから不要な画面を整理。

残す:

```text
Dashboard
Analytics
E-commerce
Finance
Authentication
Profile
Settings系
```

不要な画面は段階的に削除。

### 完了条件

プロジェクトのナビゲーションが越境商品リサーチ用になっている。

---

# 69. STEP 2 — ブランド/UI設計

### 作業

仮ブランド:

```text
CrossBorder Opportunity AI
```

を設定。

### デザイン

```text
Neutral
Minimal
Data-focused
Professional
```

を基本とする。

派手なECサイト風デザインにはしない。

---

# 70. STEP 3 — Dashboardモック

BackendなしでUIだけ作る。

### 作る

```text
Dashboard
Opportunity
Product Detail
Markets
Seasonal
```

### データ

最初はMock Data。

### 完了条件

実データなしでも、サービスの完成イメージが確認できる。

---

# 71. STEP 4 — AI Research UI

作成:

```text
Research Form
Research Progress
Research Result
```

### 完了条件

```text
キャンプ用品
```

を入力するとMock APIで処理が進み、結果画面まで到達する。

---

# 72. STEP 5 — Backend基盤

推奨:

```text
FastAPI
```

### API

```text
POST /research
GET /research/{id}
GET /opportunities
GET /products/{id}
POST /profit/simulate
GET /markets
GET /seasonal
```

---

# 73. STEP 6 — Database

推奨:

```text
PostgreSQL
```

### 初期テーブル

```text
users
categories
products
product_matches
market_prices
exchange_rates
cost_rules
profit_calculations
opportunities
seasonal_profiles
research_jobs
watchlists
alerts
```

---

# 74. STEP 7 — Category Agent

実装:

```text
カテゴリー
↓
サブカテゴリー
↓
商品タイプ
```

### 完了条件

「キャンプ用品」から有効な商品タイプを生成できる。

---

# 75. STEP 8 — Product Discovery

商品候補を取得。

最初は対象データソースを少数に限定する。

APIまたは利用規約上許可されたデータ取得手段を優先する。

---

# 76. STEP 9 — Product Matching

日本商品と中国商品をマッチング。

```text
Exact
Model
Brand
Semantic
Image
```

を組み合わせる。

---

# 77. STEP 10 — Price Normalization

```text
JPY
CNY
```

を統一。

保存:

```text
original_price
currency
normalized_price
exchange_rate
checked_at
source
```

---

# 78. STEP 11 — Profit Engine

```text
販売価格
-
仕入価格
-
送料
-
税等
-
販売手数料
=
推定利益
```

を実装。

---

# 79. STEP 12 — Opportunity Engine

```text
Profit
Demand
Price Gap
Competition
Seasonality
Risk
```

からScoreを計算。

最初はルールベース。

将来的に実績データを使って重みを最適化する。

---

# 80. STEP 13 — Direction Engine

各商品について、

```text
Japan → China
China → Japan
```

を別々に評価。

最終結果:

```text
BEST_DIRECTION
```

を保存。

---

# 81. STEP 14 — Seasonal Engine

初期:

```text
月
季節
イベント
国
```

によるルールベース。

Phase 2:

```text
過去価格
需要
検索トレンド
販売データ
```

から予測モデルへ拡張。

---

# 82. STEP 15 — BI接続

Dashboardを実データに接続。

順番:

```text
KPI
↓
Opportunity Table
↓
Product Detail
↓
Market
↓
Profit
↓
Seasonal
```

---

# 83. STEP 16 — Watchlist

ユーザーがカテゴリー・商品を保存。

定期再調査の対象にする。

---

# 84. STEP 17 — Scheduler

```text
Daily
Weekly
```

から開始。

処理:

```text
価格更新
為替更新
商品再評価
Score再計算
季節性再評価
```

---

# 85. STEP 18 — Alert

条件例:

```text
Score >= 90
Margin >= 30%
Price Gap >= 50%
Demand Growth >= 20%
```

を設定可能にする。

---

# 86. STEP 19 — 認証

テンプレートのAuthenticationを活用。

MVPでは、

```text
Email/Password
```

または利用する認証サービスを1つに限定する。

---

# 87. STEP 20 — 本番環境

候補:

```text
Frontend
Vercel

Backend
Docker
VPS / Cloud

Database
PostgreSQL

Scheduler
Worker

Monitoring
Logs
Error Tracking
```

---

# 88. 開発優先順位

最優先:

```text
1. UI土台
2. Dashboard
3. AI Research
4. Product
5. Japan/China比較
6. Matching
7. Profit
8. Opportunity Score
```

次:

```text
9. Seasonal
10. Watchlist
11. Alerts
12. Analytics
```

後:

```text
13. 需要予測
14. 価格予測
15. OEM分析
16. 自動化
```

---

# 89. 最初の完成目標

最初のMVPでは、以下だけを完成させる。

```text
ユーザー
 ↓
「キャンプ用品」と入力
 ↓
AIカテゴリー分解
 ↓
商品候補
 ↓
日本価格
 ↓
中国価格
 ↓
商品マッチング
 ↓
為替
 ↓
送料等
 ↓
推定利益
 ↓
Opportunity Score
 ↓
ランキング
 ↓
Product Detail
```

この一連の流れが動けばMVP完成とする。

---

# 90. UI開発時のGit運用

UIテンプレートを直接破壊せず、機能単位でcommitする。

例:

```text
chore: initialize from next-shadcn-admin-dashboard
feat: add cross-border navigation
feat: add research page
feat: add opportunity dashboard
feat: add product detail
feat: add profit simulator
feat: add market comparison
feat: add seasonal opportunities
feat: connect research API
```

---

# 91. 推奨ディレクトリ方針

採用元リポジトリがcolocation-based architectureを採用しているため、その思想を維持する。

概念:

```text
src/
├── app/
│   ├── dashboard/
│   ├── research/
│   ├── opportunities/
│   ├── products/
│   ├── markets/
│   ├── seasonal/
│   ├── analytics/
│   ├── watchlists/
│   └── settings/
│
├── components/
│   ├── ui/
│   ├── charts/
│   ├── product/
│   ├── opportunity/
│   └── research/
│
├── lib/
│   ├── api/
│   ├── formatters/
│   ├── calculations/
│   └── constants/
│
└── hooks/
```

実際のパスは採用時点のテンプレート構造に合わせて調整する。

---

# 92. UIとBackendの責務

## Frontend

```text
表示
入力
フィルター
チャート
テーブル
ユーザー操作
```

## Backend

```text
AI
商品取得
価格
為替
利益計算
Score
季節性
```

Frontendにビジネスロジックを大量に入れない。

---

# 93. AIとルールエンジンの責務

AIにすべてを任せない。

## AI

```text
カテゴリー分類
商品意味理解
商品マッチング
商品説明
トレンド解釈
```

## Rule Engine

```text
為替
利益
手数料
Score
閾値
リスク
```

数値計算は可能な限り決定論的なコードで行う。

---

# 94. データ品質

商品データには必ず、

```text
source
source_url
retrieved_at
currency
original_price
normalized_price
match_confidence
```

を保存する。

AIが生成した情報と、外部ソースから取得した情報を区別する。

---

# 95. UI上の信頼性表示

各商品に、

```text
Data Confidence

🟢 High
🟡 Medium
🔴 Low
```

を表示。

例えば、

```text
Match Confidence 98%
Price Confidence 94%
Profit Confidence 82%
```

とする。

---

# 96. 重要なセキュリティ方針

APIキー等はFrontendに置かない。

```text
Browser
 ↓
Backend
 ↓
External API
```

とする。

秘密情報:

```text
.env
Secret Manager
```

等で管理する。

---

# 97. ライセンス確認

採用ベースはMIT Licenseであることを確認している。

ただし、今後追加するUIライブラリ・アイコン・画像・商品データ取得サービスについては、それぞれ個別にライセンス・利用条件を確認する。

特に、

```text
商品画像
商品説明
価格データ
ブランド情報
販売サイトデータ
```

はUIテンプレートのMITライセンスとは別問題として扱う。

---

# 98. 採用理由

このテンプレートを採用する理由:

1. Next.js 16対応
2. TypeScript
3. Tailwind CSS v4
4. shadcn/ui
5. TanStack Table
6. Analytics Dashboard
7. E-commerce Dashboard
8. Finance Dashboard
9. 認証画面
10. レスポンシブ
11. テーマ切替
12. MIT License
13. colocation architecture
14. 継続的に更新されている

したがって、

> **UIをゼロから作るより、本プロジェクトのMVP開発速度を大きく上げられる可能性が高い。**

---

# 99. 開発ロードマップ

```text
Phase 0
Repository / License / Environment
        ↓
Phase 1
UI Template Adaptation
        ↓
Phase 2
Dashboard Mock
        ↓
Phase 3
AI Research Mock
        ↓
Phase 4
Backend
        ↓
Phase 5
Database
        ↓
Phase 6
Product Discovery
        ↓
Phase 7
Product Matching
        ↓
Phase 8
Price / FX
        ↓
Phase 9
Profit Engine
        ↓
Phase 10
Opportunity Score
        ↓
Phase 11
Direction Engine
        ↓
Phase 12
Seasonal Engine
        ↓
Phase 13
Real Dashboard
        ↓
Phase 14
Watchlist
        ↓
Phase 15
Alerts
        ↓
Phase 16
Production
```

---

# 100. 完成判定

MVP完成:

```text
□ GitHub UI土台を起動できる
□ 越境商品用ナビゲーションになっている
□ AI Research画面がある
□ 商品候補を生成できる
□ 日本/中国価格を比較できる
□ 商品マッチングができる
□ 為替換算できる
□ 実質利益を計算できる
□ Opportunity Scoreを表示できる
□ 日本→中国を評価できる
□ 中国→日本を評価できる
□ 商品詳細を表示できる
□ Dashboardにランキングを表示できる
```

Phase 2完成:

```text
□ 季節性
□ 需要予測
□ 価格履歴
□ Watchlist
□ 自動更新
□ Alert
□ Analytics
```

---

# 101. 最終方針

このプロジェクトでは、

**GitHubテンプレートを「完成品」として使うのではなく、「UI/UXの高速な土台」として使う。**

```text
next-shadcn-admin-dashboard
            ↓
既存UIを再利用
            ↓
CrossBorder AI用に再設計
            ↓
AI Research
Opportunity
Product Intelligence
Japan ↔ China
Seasonal
Market Analytics
            ↓
独自サービス
```

とする。

最も重要なのは、UIの美しさだけではない。

ユーザーが最終的に、

> **「この商品は、どちらの国からどちらの国へ、いつ販売すると、どの程度の利益機会があるのか？」**

を数秒で判断できるUIにすることである。
