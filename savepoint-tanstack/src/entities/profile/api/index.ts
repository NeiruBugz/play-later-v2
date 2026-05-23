// PUBLIC barrel — client-reachable. Server-only `.server.ts` VALUE exports
// (getProfileById, getProfileByUsername, getPublicProfile, updateProfile,
// getUsernameAvailability, getOnboardingSignals, getProfileSetupStatus) are
// deep-imported by their server consumers, never re-exported here (bundler
// import-protection denies `.server.*` in the client build). See FOOT-GUNS.md #2
// + the barrel-hygiene rule. Type-only re-exports below are erased at build time
// and are safe for client modules.
export type { UpdateProfileInput } from "./update-profile.server";
export type { OnboardingSignals } from "./get-onboarding-signals.server";
export type { ProfileSetupStatus } from "./get-profile-setup-status.server";
