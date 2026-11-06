import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_INIT_SCRIPT } from "./theme-init-script";

function runScript({
  stored,
  deviceIsDark,
}: {
  stored: string | null;
  deviceIsDark: boolean;
}) {
  window.localStorage.clear();
  if (stored !== null) window.localStorage.setItem("theme", stored);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" && deviceIsDark,
    }))
  );
  window.eval(THEME_INIT_SCRIPT);
  return document.documentElement;
}

describe("THEME_INIT_SCRIPT", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  describe("given a stored choice", () => {
    it("shows Light when Light is stored on a dark device", () => {
      const root = runScript({ stored: "light", deviceIsDark: true });
      expect(root.classList.contains("dark")).toBe(false);
      expect(root.style.colorScheme).toBe("light");
      expect(root).toHaveAttribute("data-theme", "light");
    });

    it("shows Dark when Dark is stored on a light device", () => {
      const root = runScript({ stored: "dark", deviceIsDark: false });
      expect(root.classList.contains("dark")).toBe(true);
      expect(root.style.colorScheme).toBe("dark");
      expect(root).toHaveAttribute("data-theme", "dark");
    });

    it("follows the device when System is stored", () => {
      const root = runScript({ stored: "system", deviceIsDark: true });
      expect(root.classList.contains("dark")).toBe(true);
      expect(root).not.toHaveAttribute("data-theme");
    });
  });

  describe("given no stored choice", () => {
    it("shows Dark on a dark device", () => {
      const root = runScript({ stored: null, deviceIsDark: true });
      expect(root.classList.contains("dark")).toBe(true);
      expect(root.style.colorScheme).toBe("dark");
    });

    it("shows Light on a light device", () => {
      const root = runScript({ stored: null, deviceIsDark: false });
      expect(root.classList.contains("dark")).toBe(false);
      expect(root.style.colorScheme).toBe("light");
    });
  });

  describe("given an invalid stored value such as a retired theme", () => {
    it("falls back to System on a dark device", () => {
      const root = runScript({ stored: "cartridge", deviceIsDark: true });
      expect(root.classList.contains("dark")).toBe(true);
      expect(root).not.toHaveAttribute("data-theme");
    });

    it("falls back to System on a light device", () => {
      const root = runScript({ stored: "cartridge", deviceIsDark: false });
      expect(root.classList.contains("dark")).toBe(false);
      expect(root).not.toHaveAttribute("data-theme");
    });
  });
});
