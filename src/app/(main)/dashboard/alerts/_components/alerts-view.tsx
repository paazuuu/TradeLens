"use client";

import * as React from "react";

import { fetchDbAlerts } from "@/lib/research/alert-source";
import type { Alert } from "@/lib/research/alerts";

import { AlertList } from "./alert-list";

/** 認証済みなら DB のアラートに差し替え、そうでなければサーバー算出の fallback を表示する。 */
export function AlertsView({ fallback }: { fallback: Alert[] }) {
  const [alerts, setAlerts] = React.useState<Alert[]>(fallback);

  React.useEffect(() => {
    let cancelled = false;
    void fetchDbAlerts().then((dbAlerts) => {
      if (!cancelled && dbAlerts !== null) setAlerts(dbAlerts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AlertList alerts={alerts} />;
}
