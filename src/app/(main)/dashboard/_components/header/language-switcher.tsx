"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { Locale } from "@/lib/preferences/locale";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

const localeOptions: Locale[] = ["ja", "zh"];

export function LanguageSwitcher() {
  const { locale, m } = useI18n();
  const setPreference = usePreferencesStore((state) => state.setPreference);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={m.language.label} size="icon" variant="ghost">
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{m.language.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {localeOptions.map((option) => (
          <DropdownMenuCheckboxItem
            checked={locale === option}
            key={option}
            onCheckedChange={() => setPreference("locale", option)}
          >
            {m.language[option]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
