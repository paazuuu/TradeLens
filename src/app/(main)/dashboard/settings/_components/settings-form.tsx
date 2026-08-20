"use client";

import * as React from "react";

import { Check, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { getSettings, putSettings, type SettingsPayload } from "@/lib/api/settings";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getLocalStorageValue, setLocalStorageValue } from "@/lib/local-storage.client";
import {
  DEFAULT_SETTINGS,
  type MonitorFrequency,
  parseSettings,
  SETTINGS_STORAGE_KEY,
  type UserSettings,
} from "@/lib/research/settings";

type NumberKey = Exclude<keyof UserSettings, "emailAlerts" | "monitorFrequency">;

function toPayload(settings: UserSettings): SettingsPayload {
  return {
    exchangeRate: settings.exchangeRate,
    intlShipping: settings.intlShipping,
    domesticShipping: settings.domesticShipping,
    importTaxRate: settings.importTaxRate,
    platformFeeRate: settings.platformFeeRate,
    minMargin: settings.minMargin,
    minScore: settings.minScore,
  };
}

export function SettingsForm() {
  const { m } = useI18n();
  const s = m.settings;

  const [settings, setSettings] = React.useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  // 初回マウント: localStorage を基準にし、API があれば数値項目を上書きする。
  React.useEffect(() => {
    let cancelled = false;
    const local = parseSettings(getLocalStorageValue(SETTINGS_STORAGE_KEY));
    setSettings(local);
    void getSettings().then((remote) => {
      if (cancelled || remote === null) return;
      setSettings((prev) => ({ ...prev, ...remote }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateNumber(key: NumberKey, raw: string) {
    const value = Number(raw);
    setSettings((prev) => ({ ...prev, [key]: Number.isFinite(value) && value >= 0 ? value : 0 }));
  }

  function handleSave() {
    setLocalStorageValue(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    // 認証済みなら DB のグローバル設定にも反映（計算に反映される）。
    void putSettings(toPayload(settings));
    setSavedAt(Date.now());
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    setLocalStorageValue(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSavedAt(Date.now());
  }

  const numberField = (key: NumberKey, label: string, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`setting-${key}`}>{label}</Label>
      <Input
        className="tabular-nums"
        id={`setting-${key}`}
        inputMode="numeric"
        min={0}
        onChange={(event) => updateNumber(key, event.target.value)}
        type="number"
        value={settings[key]}
      />
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{s.fxTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {numberField("exchangeRate", s.exchangeRate, s.exchangeRateHint)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{s.costTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {numberField("intlShipping", s.intlShipping)}
            {numberField("domesticShipping", s.domesticShipping)}
            {numberField("importTaxRate", s.importTaxRate)}
            {numberField("platformFeeRate", s.platformFeeRate)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{s.thresholdTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {numberField("minMargin", s.minMargin)}
            {numberField("minScore", s.minScore)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{s.notificationTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="setting-emailAlerts">{s.emailAlerts}</Label>
              <Switch
                checked={settings.emailAlerts}
                id="setting-emailAlerts"
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailAlerts: checked }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setting-monitorFrequency">{s.monitorFrequency}</Label>
              <NativeSelect
                className="w-full"
                id="setting-monitorFrequency"
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, monitorFrequency: event.target.value as MonitorFrequency }))
                }
                value={settings.monitorFrequency}
              >
                <NativeSelectOption value="daily">{s.frequency.daily}</NativeSelectOption>
                <NativeSelectOption value="weekly">{s.frequency.weekly}</NativeSelectOption>
                <NativeSelectOption value="monthly">{s.frequency.monthly}</NativeSelectOption>
              </NativeSelect>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {savedAt ? (
          <span className="inline-flex items-center gap-1 text-green-700 text-sm dark:text-green-300">
            <Check className="size-4" />
            {s.saved}
          </span>
        ) : null}
        <Button onClick={handleReset} type="button" variant="outline">
          <RotateCcw />
          {s.reset}
        </Button>
        <Button onClick={handleSave} type="button">
          <Save />
          {s.save}
        </Button>
      </div>
    </div>
  );
}
