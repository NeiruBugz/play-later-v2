// PUBLIC barrel — client-reachable. Server-only `.server.ts` VALUE exports
// (getFollowers, getFollowing, isFollowing, countFollowers, countFollowing) are
// deep-imported by their server consumers, never re-exported here (bundler
// import-protection denies `.server.*` in the client build). See FOOT-GUNS.md #2
// + the barrel-hygiene rule. There is no client-safe surface to export yet.
export {};
