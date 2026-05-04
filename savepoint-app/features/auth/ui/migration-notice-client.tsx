"use client";

import { useEffect, useRef } from "react";

import { clearMigratedCookieAction } from "../server-actions/clear-migrated-cookie";

export function MigrationNoticeCookieClearer() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    void clearMigratedCookieAction();
  }, []);

  return null;
}
