"""AI エージェント層（docs/development_plan.md STEP 7-8, セクション 30）。

Category Agent / Product Discovery Agent を提供する。LLM（Anthropic）が利用可能なら
それを用い、認証情報が無い / 失敗した場合はルールベースにフォールバックする
（原則: セクション 93「AI にすべてを任せない」・10「AI 判断理由を説明」）。
"""
