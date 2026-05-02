export function userTags(userId: string) {
  return {
    profile: `user:${userId}:profile`,
    setup: `user:${userId}:setup`,
    steamConnection: `user:${userId}:steam-connection`,
    libraryCounts: `user:${userId}:library:counts`,
    profileStats: `user:${userId}:profile-stats`,
  } as const;
}
