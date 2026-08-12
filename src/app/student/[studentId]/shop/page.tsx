import { notFound } from "next/navigation";
import { getStudentSummary } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { ShopClient } from "@/components/student/shop-client";
import {
  ACCESSORY_OPTIONS,
  BODY_OPTIONS,
  FACE_OPTIONS,
  HAIR_OPTIONS,
  SKIN_OPTIONS,
  STAND_OPTIONS,
} from "@/lib/peeps";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
  searchParams,
}: PageProps<"/student/[studentId]/shop">) {
  const { studentId } = await params;
  const { tab } = await searchParams;

  const student = await getStudentSummary(studentId);
  if (!student) notFound();

  const db = createServerSupabase();
  const { data: catalogue } = await db
    .from("avatars")
    .select("*")
    .eq("category", "ACCESSORY")
    .order("cost");

  const { data: row } = await db
    .from("student_avatars")
    .select("unlocked_accessory_ids, equipped_accessory_ids")
    .eq("student_id", studentId)
    .maybeSingle();

  const owned = new Set(
    Array.isArray(row?.unlocked_accessory_ids)
      ? (row!.unlocked_accessory_ids as string[])
      : [],
  );
  const equipped = new Set(
    Array.isArray(row?.equipped_accessory_ids)
      ? (row!.equipped_accessory_ids as string[])
      : [],
  );

  return (
    <ShopClient
        studentId={studentId}
        seed={student.avatarSeed}
        overrides={student.overrides}
        items={student.items}
        gems={student.gems}
        activeTab={typeof tab === "string" ? tab : "hair"}
        options={{
          hair: [...HAIR_OPTIONS],
          face: [...FACE_OPTIONS],
          clothes: [...BODY_OPTIONS],
          stance: [...STAND_OPTIONS],
          accessory: [...ACCESSORY_OPTIONS],
          skin: [...SKIN_OPTIONS],
        }}
        hats={(catalogue ?? []).map((a) => ({
          id: a.id,
          label: a.label,
          icon: a.image_url,
          slot: a.slot === "badge" ? "badge" : "hat",
          cost: Number(a.cost ?? 0),
          owned: owned.has(a.id),
          equipped: equipped.has(a.id),
      }))}
    />
  );
}
