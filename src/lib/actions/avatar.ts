"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { peepFromSeed, type PeepConfig } from "@/lib/peeps";
import type { Json } from "@/lib/database.types";

/**
 * Avatar customisation and the shop.
 *
 * Gems are a real currency: earned by finishing practice rounds, spent here on
 * hats. Appearance changes (hair, face, clothes, stance) are free and always
 * available — they are how a student makes the character theirs, not a
 * paywall.
 */

/** Fields a student may change from the shop. Nothing else is writable. */
const EDITABLE: (keyof PeepConfig)[] = [
  "hair",
  "face",
  "body",
  "stand",
  "accessory",
  "skin",
];

export async function setPeepOverride(
  studentId: string,
  field: keyof PeepConfig,
  value: string,
) {
  if (!EDITABLE.includes(field)) throw new Error("Unknown appearance option");

  const db = createServerSupabase();
  const { data: row } = await db
    .from("student_avatars")
    .select("peep_overrides")
    .eq("student_id", studentId)
    .maybeSingle();

  const current = (row?.peep_overrides ?? {}) as Record<string, string>;

  await db
    .from("student_avatars")
    .update({ peep_overrides: { ...current, [field]: value } as Json })
    .eq("student_id", studentId);

  revalidatePath("/", "layout");
}

/**
 * Reroll offers three fresh characters to choose from. The seed itself is only
 * replaced when the student actually picks one, so cancelling leaves their
 * existing character untouched.
 */
export async function applyAvatarSeed(studentId: string, seed: string) {
  const clean = seed.trim().slice(0, 64);
  if (!clean) throw new Error("Invalid character");

  const db = createServerSupabase();
  await db
    .from("student_avatars")
    // A new base character means the old per-field tweaks no longer apply.
    .update({ base_avatar_seed: clean, peep_overrides: {} as Json })
    .eq("student_id", studentId);

  revalidatePath("/", "layout");
}

/** Generate candidate characters for the picker. */
export async function rollAvatarOptions(count = 3) {
  return Array.from({ length: count }, () => {
    const seed = Math.random().toString(36).slice(2, 10);
    return { seed, peep: peepFromSeed(seed) };
  });
}

/**
 * Buy a hat. Fails loudly rather than silently no-op'ing if the student cannot
 * afford it, and never charges twice for something already owned.
 */
export async function buyItem(studentId: string, itemId: string) {
  const db = createServerSupabase();

  const [{ data: item }, { data: row }] = await Promise.all([
    db.from("avatars").select("*").eq("id", itemId).maybeSingle(),
    db
      .from("student_avatars")
      .select("gems, unlocked_accessory_ids, equipped_accessory_ids")
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);

  if (!item) throw new Error("Item not found");
  if (!row) throw new Error("No character yet");

  const owned = new Set(
    Array.isArray(row.unlocked_accessory_ids)
      ? (row.unlocked_accessory_ids as string[])
      : [],
  );
  if (owned.has(itemId)) return { alreadyOwned: true, gems: Number(row.gems) };

  const cost = Number(item.cost ?? 0);
  const gems = Number(row.gems ?? 0);
  if (gems < cost) {
    throw new Error(`Not enough gems — you need ${cost - gems} more`);
  }

  owned.add(itemId);
  const equipped = Array.isArray(row.equipped_accessory_ids)
    ? (row.equipped_accessory_ids as string[])
    : [];

  await db
    .from("student_avatars")
    .update({
      gems: gems - cost,
      unlocked_accessory_ids: [...owned] as Json,
      // Wear it straight away — that is the reward for buying it.
      equipped_accessory_ids: [...new Set([...equipped, itemId])].slice(
        -2,
      ) as Json,
    })
    .eq("student_id", studentId);

  revalidatePath("/", "layout");
  return { alreadyOwned: false, gems: gems - cost };
}

/** Wear or remove an owned item. Max two at once. */
export async function toggleItem(studentId: string, itemId: string) {
  const db = createServerSupabase();

  const { data: row } = await db
    .from("student_avatars")
    .select("unlocked_accessory_ids, equipped_accessory_ids")
    .eq("student_id", studentId)
    .maybeSingle();
  if (!row) throw new Error("No character yet");

  const owned = new Set(
    Array.isArray(row.unlocked_accessory_ids)
      ? (row.unlocked_accessory_ids as string[])
      : [],
  );
  if (!owned.has(itemId)) throw new Error("You do not own that yet");

  const equipped = Array.isArray(row.equipped_accessory_ids)
    ? (row.equipped_accessory_ids as string[])
    : [];

  const next = equipped.includes(itemId)
    ? equipped.filter((id) => id !== itemId)
    : [...equipped, itemId].slice(-2);

  await db
    .from("student_avatars")
    .update({ equipped_accessory_ids: next as Json })
    .eq("student_id", studentId);

  revalidatePath("/", "layout");
  return next;
}
