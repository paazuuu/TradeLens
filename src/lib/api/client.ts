/**
 * バックエンド API クライアント（STEP 15: フロント結線）。
 *
 * ベース URL は環境変数 NEXT_PUBLIC_API_URL で指定する。未設定時は API を呼ばず、
 * 呼び出し側（data-source）がモックデータにフォールバックする。これにより
 * バックエンド未起動でもフロントは単体で動作する。
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** API が有効か（ベース URL が設定されているか）。 */
export function isApiEnabled(): boolean {
  return API_BASE_URL.length > 0;
}

/** 非 2xx 応答を表すエラー（status を保持）。 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} -> ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} -> ${res.status}`);
  }
  return (await res.json()) as T;
}
