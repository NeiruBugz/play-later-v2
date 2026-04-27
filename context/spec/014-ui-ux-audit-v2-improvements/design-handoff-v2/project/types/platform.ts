export type { Platform } from "@prisma/client";

export type PlatformDomain = import("@prisma/client").Platform;

export type PlatformSummaryDomain = {
  id: string;
  name: string;
  slug: string;
};

export type UniquePlatformResult = {
  id: string;
  name: string;
  slug: string;
};
