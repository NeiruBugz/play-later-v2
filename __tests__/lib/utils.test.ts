import {
  nameFirstLiterals,
  platformEnumToColor,
  uppercaseToNormal,
} from "@/src/lib/utils";
import { expect, test } from "vitest";

const nameMocks = [
  { expected: "U", name: "" },
  { expected: "TU", name: "Test User" },
  { expected: "T", name: "Test" },
];

test("nameFirstLiterals", () => {
  nameMocks.forEach((mock) => {
    expect(nameFirstLiterals(mock.name)).toBe(mock.expected);
  });
});

test("platformEnumToColor", () => {
  expect(platformEnumToColor("Playstation 3")).toBe("playstation");
  expect(platformEnumToColor("PLAYSTATION")).toBe("playstation");

  expect(platformEnumToColor("Xbox Series X")).toBe("xbox");
  expect(platformEnumToColor("XBOX")).toBe("xbox");

  expect(platformEnumToColor("Nintendo Switch")).toBe("nintendo");
  expect(platformEnumToColor("NINTENDO")).toBe("nintendo");
  expect(platformEnumToColor("Wii U")).toBe("nintendo");

  expect(platformEnumToColor("macOS")).toBe("pc");
  expect(platformEnumToColor("PC")).toBe("pc");
});

test("platformToUI", () => {
  expect(uppercaseToNormal("PLAYSTATION")).toBe("Playstation");

  expect(uppercaseToNormal()).toBe(undefined);
});
