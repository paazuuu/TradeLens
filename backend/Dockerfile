# CrossBorder Opportunity AI — Backend（STEP 20 本番環境）
FROM python:3.11-slim

# 実行時の推奨環境変数。
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# 依存を先に入れてレイヤキャッシュを効かせる。
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリ本体。
COPY app ./app

EXPOSE 8000

# 起動時に lifespan がテーブル作成＋未投入ならシードを行う。
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
