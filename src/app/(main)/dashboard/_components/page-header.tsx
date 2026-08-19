"use client";

import type { Messages } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/use-i18n";

/** i18n 対応のページ見出し。Server Component のページから section キーで呼び出す。 */
export function PageHeader({ section }: { section: keyof Messages["pageHeaders"] }) {
  const { m } = useI18n();
  const heading = m.pageHeaders[section];

  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-semibold text-2xl tracking-tight">{heading.title}</h1>
      <p className="text-muted-foreground text-sm">{heading.description}</p>
    </div>
  );
}
