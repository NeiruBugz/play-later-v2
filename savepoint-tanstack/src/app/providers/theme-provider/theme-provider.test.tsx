/**
 * Theme provider tests.
 *
 * These tests assert that the `<html>` element receives the correct CSS class
 * for each named theme. Theme value === CSS class name:
 *
 *   light     → no theme class on <html>
 *   dark      → <html class="dark …">
 *   cartridge → <html class="cartridge …">
 *   aurora    → <html class="aurora …">
 *   system    → resolved via prefers-color-scheme
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

  describe("given theme is cartridge", () => {
    beforeEach(() => {
      stubMatchMedia(false);
      render(
        <ThemeHarness theme="cartridge">
          <div />
        </ThemeHarness>
      );
    });

    it("applies the cartridge class to <html>", () => {
      expect(getHtmlClasses()).toContain("cartridge");
    });

    it("does not apply a class named y2k to <html>", () => {
      expect(getHtmlClasses()).not.toContain("y2k");
    });
  });

  describe("given theme is aurora", () => {
    beforeEach(() => {
      stubMatchMedia(false);
      render(
        <ThemeHarness theme="aurora">
          <div />
        </ThemeHarness>
      );
    });

    it("applies the aurora class to <html>", () => {
      expect(getHtmlClasses()).toContain("aurora");
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
