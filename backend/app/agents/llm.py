"""Anthropic LLM の薄いラッパー。認証情報が無ければ「利用不可」を返し、呼び出し側が
ルールベースへフォールバックできるようにする。

モデルは既定 claude-opus-5（環境変数 ANTHROPIC_MODEL で上書き可）。カテゴリー分解や
商品候補生成は比較的単純なため effort=low で実行する。出力は JSON テキストで受け取り
json.loads で厳密にパースする（生成 JSON のエスケープ差異に備えて生文字列一致はしない）。
"""

from __future__ import annotations

import json
import os
from typing import Any

try:  # SDK 未インストールでもアプリは起動できるようにする。
    import anthropic

    _HAS_SDK = True
except ImportError:  # pragma: no cover
    _HAS_SDK = False

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5")

_client: Any = None


def is_llm_available() -> bool:
    """SDK が入っており、認証情報（環境変数）が存在するか。"""
    if not _HAS_SDK:
        return False
    return bool(os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN"))


def _get_client() -> Any:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _extract_json(text: str) -> str:
    """マークダウンのコードフェンスを剥がして JSON 本文を取り出す。"""
    stripped = text.strip()
    if stripped.startswith("```"):
        # ```json ... ``` / ``` ... ``` の中身を取り出す。
        body = stripped.split("```", 2)
        if len(body) >= 2:
            inner = body[1]
            if inner.startswith("json"):
                inner = inner[4:]
            return inner.strip()
    return stripped


def complete_json(system: str, user: str, max_tokens: int = 4000) -> Any:
    """JSON を返す 1 ショット補完。失敗時は例外を送出（呼び出し側でフォールバック）。"""
    client = _get_client()
    response = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        output_config={"effort": "low"},
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    if response.stop_reason == "refusal":
        raise RuntimeError("LLM refused the request")
    text = "".join(block.text for block in response.content if block.type == "text")
    return json.loads(_extract_json(text))
