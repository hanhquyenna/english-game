/**
 * Open Peeps character system — the single source of avatar identity.
 *
 * Mirrors the API the design prototype expected from its `peeps.js`
 * (peepFromSeed / option lists), implemented on top of `react-peeps`, which is
 * a React port of Pablo Stanley's Open Peeps (CC0). Everything here is pure so
 * a character is fully determined by its seed and can be unit-tested.
 *
 * Option lists are curated rather than exhaustive: this is a children's school
 * product, so the doctor/COVID poses, facial hair, and the angry/monster faces
 * are deliberately left out of the pickers.
 */

import type {
  AccessoryType,
  BustPoseType,
  FaceType,
  HairType,
  StandingPoseType,
} from "react-peeps";

export type PeepConfig = {
  hair: HairType;
  face: FaceType;
  /** Bust pose — the outfit on the head-and-shoulders avatar. */
  body: BustPoseType;
  /** Standing pose — the full-body view in the shop and picker. */
  stand: StandingPoseType;
  accessory: AccessoryType;
  skin: string;
};

export const HAIR_OPTIONS: readonly HairType[] = [
  "Afro", "Bangs", "BangsFilled", "Bun", "BunCurly", "Buns",
  "Long", "LongAfro", "LongBangs", "LongCurly",
  "Medium", "MediumBangs", "MediumLong", "MediumShort", "MediumStraight",
  "Mohawk", "Short", "ShortCurly", "ShortMessy", "ShortVolumed", "ShortWavy",
  "BantuKnots", "Beanie", "CornRows", "Twists", "TwistsVolumed",
  "Hijab", "Turban", "FlatTop", "Pomp",
] as const;

/**
 * Friendly faces only. The library also ships angry/monster/fearful faces;
 * none of them belong on a nine-year-old's school profile.
 */
export const FACE_OPTIONS: readonly FaceType[] = [
  "Smile", "SmileBig", "SmileTeeth", "SmileLol", "SmileNM",
  "Cheeky", "Calm", "CalmNM", "Cute", "Awe", "LoveGrin",
  "Explaining", "Driven", "EatingHappy", "CheersNM",
] as const;

/** Bust poses = the "Clothes" tab. School-appropriate outfits only. */
export const BODY_OPTIONS: readonly BustPoseType[] = [
  "Shirt", "ButtonShirt", "Hoodie", "Turtleneck", "Sweater", "SweaterDots",
  "StripedShirt", "PocketShirt", "PoloSweater", "SportyShirt", "ShirtFilled",
  "Geek", "Gaming", "Device", "Explaining", "PointingUp", "ArmsCrossed",
  "DotJacket", "ShirtCoat", "Paper",
] as const;

/** Standing poses, for the full-body view. */
export const STAND_OPTIONS: readonly StandingPoseType[] = [
  "ShirtBW", "ShirtWB", "ShirtPantsBW", "ShirtPantsWB", "PolkaDots",
  "CrossedArmsBW", "CrossedArmsWB", "EasingBW", "EasingWB",
  "PointingFingerBW", "PointingFingerWB", "RestingBW", "RestingWB",
  "WalkingBW", "WalkingWB", "WalkingFilled", "RoboDanceBW", "RoboDanceWB",
] as const;

export const ACCESSORY_OPTIONS: readonly AccessoryType[] = [
  "None", "GlassRoundThick", "GlassRound", "GlassAviator",
  "GlassClubmaster", "GlassButterfly", "SunglassWayfarer",
] as const;

/**
 * Skin tones. In Open Peeps this is the *fill* (`backgroundColor`); the
 * `strokeColor` prop is the ink the figure is drawn with, which stays a
 * constant dark line so every character reads as one illustration set.
 */
export const SKIN_OPTIONS = [
  "#f8d5c2", "#f0c4a8", "#e0a878", "#c98c62", "#a9714b", "#8d5b3f", "#6b4a35",
] as const;

export const INK = "#2a2540";

/** FNV-1a — a small, stable string hash so a seed always yields one character. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(list: readonly T[], seed: string, salt: string): T {
  return list[hash(seed + ":" + salt) % list.length];
}

/**
 * The student's fixed identity. Set once from a seed and never regenerated,
 * so the same person renders as the same character on every screen.
 */
export function peepFromSeed(seed: string): PeepConfig {
  return {
    hair: pick(HAIR_OPTIONS, seed, "hair"),
    face: pick(FACE_OPTIONS, seed, "face"),
    body: pick(BODY_OPTIONS, seed, "body"),
    stand: pick(STAND_OPTIONS, seed, "stand"),
    accessory: hash(seed + ":acc") % 4 === 0
      ? pick(ACCESSORY_OPTIONS.slice(1), seed, "acc2")
      : "None",
    skin: pick(SKIN_OPTIONS, seed, "skin"),
  };
}

/** Merge stored customisations over the seed-derived base. */
export function peepWithOverrides(
  seed: string,
  overrides?: Partial<PeepConfig> | null,
): PeepConfig {
  return { ...peepFromSeed(seed), ...(overrides ?? {}) };
}

/**
 * Crop windows.
 *
 * Bust poses are drawn inside roughly 850x800 with the head at the top, so the
 * head-and-shoulders avatar takes a square window there. Standing poses use a
 * much taller canvas (their geometry runs to ~2560 units), which is why the
 * full-body view needs its own, far taller window rather than the library's
 * 850x1200 default — that default cuts a standing figure off at the waist.
 */
export const VIEWBOX = {
  bust: { x: "80", y: "0", width: "700", height: "700" },
  full: { x: "-80", y: "0", width: "1150", height: "2650" },
} as const;

/** Full-body figures are tall and narrow; bust avatars are square. */
export const ASPECT = { bust: 1, full: 0.46 } as const;

/**
 * An unlockable layered on top of the character — a hat sitting on the head or
 * a badge pinned to the corner. `icon` is a filename stem in
 * `public/assets/items`. Lives here rather than in the component so server code
 * can build these without importing a client module.
 */
export type EquippedItem = {
  icon: string;
  slot: "hat" | "badge";
  color?: string;
  label?: string;
};

/** Default tint per item, used when the catalogue row doesn't override it. */
export const ITEM_COLORS: Record<string, string> = {
  "jester-hat": "#ff8a5c",
  "study-cap": "#2a2540",
  crown: "#f0b429",
  medal: "#f0b429",
  flame: "#ff6b35",
  gem: "#3d6fe0",
};
