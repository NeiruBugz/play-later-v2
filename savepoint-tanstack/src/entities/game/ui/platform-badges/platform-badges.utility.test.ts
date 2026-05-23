import { BsXbox } from "react-icons/bs";
import {
  SiApple,
  SiLinux,
  SiNintendo,
  SiPlaystation,
  SiSteam,
} from "react-icons/si";
import { TbBrandWindows, TbDeviceGamepad2 } from "react-icons/tb";
import { describe, expect, it } from "vitest";

import {
  abbreviatePlatformName,
  getPlatformIcon,
} from "./platform-badges.utility";

describe("getPlatformIcon", () => {
  it("returns SiPlaystation for 'PlayStation 5'", () => {
    expect(getPlatformIcon("PlayStation 5")).toBe(SiPlaystation);
  });

  it("returns SiPlaystation for a string where ps appears as a whole word (e.g. 'The PS')", () => {
    // \bps\b requires word boundaries on both sides; "PS" as a standalone word qualifies.
    expect(getPlatformIcon("PS")).toBe(SiPlaystation);
  });

  it("returns BsXbox for 'Xbox Series X|S'", () => {
    expect(getPlatformIcon("Xbox Series X|S")).toBe(BsXbox);
  });

  it("returns SiNintendo for 'Nintendo Switch'", () => {
    expect(getPlatformIcon("Nintendo Switch")).toBe(SiNintendo);
  });

  it("returns SiNintendo for 'Wii'", () => {
    expect(getPlatformIcon("Wii")).toBe(SiNintendo);
  });

  it("returns TbBrandWindows for 'PC (Microsoft Windows)'", () => {
    expect(getPlatformIcon("PC (Microsoft Windows)")).toBe(TbBrandWindows);
  });

  it("returns SiApple for 'macOS'", () => {
    expect(getPlatformIcon("macOS")).toBe(SiApple);
  });

  it("returns SiApple for a platform containing 'mac'", () => {
    expect(getPlatformIcon("Mac")).toBe(SiApple);
  });

  it("returns SiLinux for 'Linux'", () => {
    expect(getPlatformIcon("Linux")).toBe(SiLinux);
  });

  it("returns SiSteam for 'Steam Deck'", () => {
    expect(getPlatformIcon("Steam Deck")).toBe(SiSteam);
  });

  it("returns TbDeviceGamepad2 for a standalone 'PC' (matched by \\bpc\\b)", () => {
    expect(getPlatformIcon("PC")).toBe(TbDeviceGamepad2);
  });

  it("returns TbDeviceGamepad2 for an unrecognised platform name", () => {
    expect(getPlatformIcon("Atari Jaguar")).toBe(TbDeviceGamepad2);
  });
});

describe("abbreviatePlatformName", () => {
  it("abbreviates 'PlayStation 5' to 'PS5'", () => {
    expect(abbreviatePlatformName("PlayStation 5")).toBe("PS5");
  });

  it("abbreviates 'Nintendo Switch' to 'Switch'", () => {
    expect(abbreviatePlatformName("Nintendo Switch")).toBe("Switch");
  });

  it("abbreviates 'PC (Microsoft Windows)' to 'PC'", () => {
    expect(abbreviatePlatformName("PC (Microsoft Windows)")).toBe("PC");
  });

  it("returns the original name for an unrecognised platform", () => {
    expect(abbreviatePlatformName("Atari Jaguar")).toBe("Atari Jaguar");
  });
});
