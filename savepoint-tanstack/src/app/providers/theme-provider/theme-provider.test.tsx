/**
 * Theme provider tests.
 *
 * These tests assert that the `<html>` element receives the correct CSS class
 * for each named theme. Theme value === CSS class name:
 *
 *   light  → no theme class on <html>
 *   dark   → <html class="dark …">
 *   system → resolved via prefers-color-scheme
 *
 * Spec 022 Slice 2: the theme system is consolidated to Light / Dark / System.
 * A stored retired theme (e.g. "cartridge", "aurora") is no longer valid and
 * falls back to the configured default; the provider only ever toggles `dark`.
 *
 * Slice 19 GREEN: the provider is hand-rolled (NOT `next-themes`). See
 * DIVERGENCES.md for rationale. The wrapper config below mirrors the canonical
 * Next.js app's `value={...}` so the user-observable assertions stay identical.
 */

import { render } from "@testing-library/react";
import { type PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Theme } from "@/shared/lib/theme";

import { SavepointThemeProvider } from "./theme-provider";

function getHtmlClasses(): string[] {
  return Array.from(document.documentElement.classList);
}

function ThemeHarness({
  theme,
  children,
}: PropsWithChildren<{ theme: Theme }>) {
  // forcedTheme locks the value and triggers an imperative apply on mount —
  // exactly the user-observable shape we want to assert against.
  return (
    <SavepointThemeProvider defaultTheme={theme} forcedTheme={theme}>
      {children}
    </SavepointThemeProvider>
  );
}

function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string): MediaQueryList =>
      ({
        matches: prefersDark && query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  );
}

describe("ThemeProvider (html class application)", () => {
  afterEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("given theme is light", () => {
    beforeEach(() => {
      stubMatchMedia(false);
      render(
        <ThemeHarness theme="light">
          <div />
        </ThemeHarness>
      );
    });

    it("does not apply the dark class to <html>", () => {
      expect(getHtmlClasses()).not.toContain("dark");
    });

    it("does not apply the cartridge class to <html>", () => {
      expect(getHtmlClasses()).not.toContain("cartridge");
    });

    it("does not apply the aurora class to <html>", () => {
      expect(getHtmlClasses()).not.toContain("aurora");
    });
  });

  describe("given theme is dark", () => {
    beforeEach(() => {
      stubMatchMedia(false);
      render(
        <ThemeHarness theme="dark">
          <div />
        </ThemeHarness>
      );
    });

    it("applies the dark class to <html>", () => {
      expect(getHtmlClasses()).toContain("dark");
    });
  });

  describe("given a retired theme 'cartridge' is stored in localStorage", () => {
    beforeEach(() => {
      stubMatchMedia(false);
      localStorage.setItem("theme", "cartridge");
      render(
        <SavepointThemeProvider defaultTheme="system">
          <div />
        </SavepointThemeProvider>
      );
    });

    it("does not apply a cartridge class to <html> (falls back to system)", () => {
      expect(getHtmlClasses()).not.toContain("cartridge");
    });

    it("only ever toggles the dark class, never a retired theme class", () => {
      const classes = getHtmlClasses();
      expect(classes).not.toContain("cartridge");
      expect(classes).not.toContain("aurora");
      expect(classes).not.toContain("y2k");
      expect(classes).not.toContain("jewel");
    });
  });

  describe("given a retired theme 'aurora' is stored in localStorage", () => {
    beforeEach(() => {
      stubMatchMedia(true);
      localStorage.setItem("theme", "aurora");
      render(
        <SavepointThemeProvider defaultTheme="system">
          <div />
        </SavepointThemeProvider>
      );
    });

    it("does not apply an aurora class to <html> (falls back to system)", () => {
      expect(getHtmlClasses()).not.toContain("aurora");
    });

    it("resolves to system — applies the dark class when system prefers dark", () => {
      expect(getHtmlClasses()).toContain("dark");
    });
  });

  describe("given theme is system and prefers-color-scheme is dark", () => {
    beforeEach(() => {
      stubMatchMedia(true);
      render(
        <ThemeHarness theme="system">
          <div />
        </ThemeHarness>
      );
    });

    it("applies the dark class to <html> when system prefers dark", () => {
      expect(getHtmlClasses()).toContain("dark");
    });
  });

  describe("given theme is system and prefers-color-scheme is light", () => {
    beforeEach(() => {
      stubMatchMedia(false);
      render(
        <ThemeHarness theme="system">
          <div />
        </ThemeHarness>
      );
    });

    it("does not apply the dark class to <html> when system prefers light", () => {
      expect(getHtmlClasses()).not.toContain("dark");
    });
  });

  describe("SavepointThemeProvider wrapper (smoke test)", () => {
    beforeEach(() => {
      stubMatchMedia(false);
    });

    it("renders its children without throwing", () => {
      expect(() =>
        render(
          <SavepointThemeProvider>
            <div data-testid="child">hello</div>
          </SavepointThemeProvider>
        )
      ).not.toThrow();
    });
  });
});
