export {
  type PlatformDomain,
  type PlatformSummaryDomain,
  type PlatformDTO,
  type PlatformSummaryDTO,
} from "@/data-access-layer/domain/platform";

export type UniquePlatformResult = {
  id: string;
  name: string;
  slug: string;
};
