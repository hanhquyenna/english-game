/**
 * Feature Flags for Beeblast Game Loop v1 features.
 * Prevents "Coming Soon" dead-end tiles when a feature is not ready/enabled.
 */

export const FEATURE_FLAGS = {
  ROLE_PLAY: true,
  ACTIVE_PRACTICE: true,
  STORY_LIBRARY: true,
  TIER_LEADERBOARD: true,
  BUDDY_PET: true,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[key] ?? false;
}
