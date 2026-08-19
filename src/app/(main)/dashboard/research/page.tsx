import { ResearchWorkspace } from "./_components/research-workspace";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">AI Research</h1>
        <p className="text-muted-foreground text-sm">
          カテゴリーを入力して越境商品リサーチを開始します。AI がカテゴリー分解から Opportunity Score
          までを自動処理します。
        </p>
      </div>

      <ResearchWorkspace />
    </div>
  );
}
