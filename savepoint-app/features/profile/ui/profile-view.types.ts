import type { ProfileWithStats } from "@/features/profile/types";

export type SocialCounts = {
  followers: number;
  following: number;
};

export interface ProfileViewProps {
  profile: ProfileWithStats;
  socialCounts?: SocialCounts | null;
}
