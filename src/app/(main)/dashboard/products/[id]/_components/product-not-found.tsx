"use client";

import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";

export function ProductNotFound() {
  const { m } = useI18n();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="font-medium text-lg">{m.productDetail.notFound}</p>
      <Button asChild size="sm" variant="outline">
        <Link href="/dashboard/opportunities">
          <ArrowLeft />
          {m.productDetail.backToRanking}
        </Link>
      </Button>
    </div>
  );
}
