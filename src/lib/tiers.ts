/**
 * Leaderboard tiers, from the design prototype: rank 1 is Champion, 2-6
 * Diamond, 7-16 Gold, the rest Bronze. The tier decides the ring around a
 * student's character on the leaderboard and their profile.
 */
export type Tier = {
  tier: "Champion" | "Diamond" | "Gold" | "Bronze";
  ring: string;
  textColor: string;
  level: number;
};

export function tierForIndex(index: number): Tier {
  if (index === 0)
    return { tier: "Champion", ring: "#ffd54a", textColor: "#5c4300", level: 4 };
  if (index <= 5)
    return { tier: "Diamond", ring: "#3d6fe0", textColor: "#fff", level: 3 };
  if (index <= 15)
    return { tier: "Gold", ring: "#f0b429", textColor: "#5c4300", level: 2 };
  return { tier: "Bronze", ring: "#c9a27a", textColor: "#3a2410", level: 1 };
}

/** Streak badges on the profile, matching the design's four milestones. */
export const STREAK_MILESTONES = [
  { days: 5, sub: "5 days" },
  { days: 7, sub: "1 week" },
  { days: 14, sub: "2 weeks" },
  { days: 28, sub: "4 weeks" },
] as const;

export const BADGE_COLORS = [
  { frameBg: "#8a6a52", innerBg: "#6b5140", numColor: "#e8c9a8" },
  { frameBg: "#a8a8b4", innerBg: "#7c7c8a", numColor: "#eef0f5" },
  { frameBg: "#f0b429", innerBg: "#c9820a", numColor: "#fff4dc" },
  { frameBg: "#3d6fe0", innerBg: "#2a4fb0", numColor: "#e6efff" },
] as const;
