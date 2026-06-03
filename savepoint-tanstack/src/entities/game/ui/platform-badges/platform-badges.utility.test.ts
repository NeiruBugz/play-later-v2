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
  getPlatformBadgeVariant,
  getPlatformFamily,
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

describe("getPlatformFamily", () => {
  describe("playstation family", () => {
    it("classifies 'PlayStation 5'", () => {
      expect(getPlatformFamily("PlayStation 5")).toBe("playstation");
    });

    it("classifies 'PlayStation Vita'", () => {
      expect(getPlatformFamily("PlayStation Vita")).toBe("playstation");
    });

    it("classifies a standalone 'PS' (matched by \\bps\\b)", () => {
      expect(getPlatformFamily("PS")).toBe("playstation");
    });
  });

  describe("xbox family", () => {
    it("classifies 'Xbox Series X|S'", () => {
      expect(getPlatformFamily("Xbox Series X|S")).toBe("xbox");
    });
  });

  describe("nintendo family", () => {
    it("classifies 'New Nintendo 3DS'", () => {
      expect(getPlatformFamily("New Nintendo 3DS")).toBe("nintendo");
    });

    it("classifies 'Wii'", () => {
      expect(getPlatformFamily("Wii")).toBe("nintendo");
    });
  });

  describe("pc family", () => {
    it("classifies 'PC (Microsoft Windows)'", () => {
      expect(getPlatformFamily("PC (Microsoft Windows)")).toBe("pc");
    });

    it("classifies 'Steam Deck'", () => {
      expect(getPlatformFamily("Steam Deck")).toBe("pc");
    });

    it("classifies 'Mac'", () => {
      expect(getPlatformFamily("Mac")).toBe("pc");
    });

    it("classifies 'Linux'", () => {
      expect(getPlatformFamily("Linux")).toBe("pc");
    });

    it("classifies a standalone 'PC' (matched by \\bpc\\b)", () => {
      expect(getPlatformFamily("PC")).toBe("pc");
    });
  });

  describe("other family (neutral)", () => {
    it("classifies 'Sega Genesis'", () => {
      expect(getPlatformFamily("Sega Genesis")).toBe("other");
    });

    it("classifies an unrecognised platform name", () => {
      expect(getPlatformFamily("Atari Jaguar")).toBe("other");
    });

    it("classifies mobile 'iOS' as other, not pc", () => {
      expect(getPlatformFamily("iOS")).toBe("other");
    });

    it("classifies mobile 'Android' as other, not pc", () => {
      expect(getPlatformFamily("Android")).toBe("other");
    });

    it("classifies 'Windows Phone' as other despite containing 'windows'", () => {
      expect(getPlatformFamily("Windows Phone")).toBe("other");
    });
  });
});

describe("getPlatformBadgeVariant", () => {
  it("maps the playstation family to the 'playstation' variant", () => {
    expect(getPlatformBadgeVariant("playstation")).toBe("playstation");
  });

  it("maps the xbox family to the 'xbox' variant", () => {
    expect(getPlatformBadgeVariant("xbox")).toBe("xbox");
  });

  it("maps the nintendo family to the 'nintendo' variant", () => {
    expect(getPlatformBadgeVariant("nintendo")).toBe("nintendo");
  });

  it("maps the pc family to the 'pc' variant", () => {
    expect(getPlatformBadgeVariant("pc")).toBe("pc");
  });

  it("maps the other family to the neutral 'subtle' variant", () => {
    expect(getPlatformBadgeVariant("other")).toBe("subtle");
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
