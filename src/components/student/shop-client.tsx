"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StudentAvatar } from "@/components/student-avatar";
import { buyItem, setPeepOverride, toggleItem } from "@/lib/actions/avatar";
import { ITEM_COLORS, type EquippedItem, type PeepConfig } from "@/lib/peeps";
import { cn } from "@/lib/utils";

/**
 * The avatar shop.
 *
 * Appearance tabs (Hair, Face, Clothes, Stance) write straight to the
 * character and are free — they are self-expression, not a paywall. The Hats
 * tab is the only place gems are spent.
 *
 * Note on "Stance": the design's fifth tab was "Shoes". Open Peeps has no
 * separately colourable shoe layer, so rather than ship a control that looks
 * like it does something and doesn't, this tab picks the full-body stance —
 * which genuinely changes the outfit and footwear shown in the preview.
 */

type Hat = {
  id: string;
  label: string;
  icon: string;
  slot: "hat" | "badge";
  cost: number;
  owned: boolean;
  equipped: boolean;
};

type TabKey = "hair" | "face" | "hat" | "clothes" | "stance";

const TABS: { key: TabKey; label: string }[] = [
  { key: "hair", label: "Hair" },
  { key: "face", label: "Face" },
  { key: "hat", label: "Hats" },
  { key: "clothes", label: "Clothes" },
  { key: "stance", label: "Stance" },
];

const FIELD_FOR: Record<Exclude<TabKey, "hat">, keyof PeepConfig> = {
  hair: "hair",
  face: "face",
  clothes: "body",
  stance: "stand",
};

export function ShopClient({
  studentId,
  seed,
  overrides,
  items,
  gems,
  activeTab,
  options,
  hats,
}: {
  studentId: string;
  seed: string;
  overrides: Partial<PeepConfig>;
  items: EquippedItem[];
  gems: number;
  activeTab: string;
  options: Record<string, string[]>;
  hats: Hat[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(
    (TABS.find((t) => t.key === activeTab)?.key ?? "hair") as TabKey,
  );
  // Optimistic preview so tapping an option updates the character instantly.
  const [preview, setPreview] = useState<Partial<PeepConfig>>(overrides);
  const [pending, start] = useTransition();

  function choose(field: keyof PeepConfig, value: string) {
    setPreview((p) => ({ ...p, [field]: value }));
    start(async () => {
      try {
        await setPeepOverride(studentId, field, value);
      } catch (e) {
        setPreview(overrides);
        toast.error(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  const showFullBody = tab === "stance" || tab === "clothes";

  return (
    <div>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-[#2a2540]">
          Avatar shop
        </h1>
        <span className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[#ece8fb] px-3 py-1.5">
          <span
            aria-hidden
            className="size-4 bg-[#3d6fe0]"
            style={{
              clipPath: "polygon(50% 0%,100% 38%,80% 100%,20% 100%,0% 38%)",
            }}
          />
          <span className="font-display text-[15px] font-extrabold text-[#3a3550]">
            {gems}
          </span>
        </span>
      </div>

      <div className="mt-3 flex justify-center rounded-2xl bg-[#f4f1ff] py-5">
        <StudentAvatar
          seed={seed}
          overrides={preview}
          items={items}
          size={showFullBody ? 210 : 130}
          variant={showFullBody ? "full" : "bust"}
          ring={showFullBody ? null : "#d3caf7"}
          background={showFullBody ? null : "#fff"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors"
            style={{
              background: tab === t.key ? "#534ab7" : "#fff",
              color: tab === t.key ? "#fff" : "#8b83c4",
              borderColor: tab === t.key ? "#534ab7" : "#ece8fb",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hat" ? (
        <ul className="mt-4 grid grid-cols-2 gap-2.5">
          {hats.map((hat) => (
            <li key={hat.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    try {
                      if (!hat.owned) {
                        await buyItem(studentId, hat.id);
                        toast.success(`${hat.label} unlocked!`);
                      } else {
                        await toggleItem(studentId, hat.id);
                      }
                      router.refresh();
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Could not do that",
                      );
                    }
                  })
                }
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 p-3.5 transition-colors",
                  hat.equipped
                    ? "border-[#58c96a] bg-[#f2fbf4]"
                    : hat.owned
                      ? "border-[#ece8fb] bg-white"
                      : "border-dashed border-[#ded9f5] bg-[#faf9ff]",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/assets/items/${hat.icon}.svg`}
                  alt=""
                  className="size-9"
                  style={{ color: ITEM_COLORS[hat.icon] ?? "#534ab7" }}
                />
                <span className="text-[12.5px] font-bold text-[#2a2540]">
                  {hat.label}
                </span>
                <span className="text-[11px] font-bold text-[#8b83c4]">
                  {hat.equipped
                    ? "Wearing"
                    : hat.owned
                      ? "Tap to wear"
                      : hat.cost === 0
                        ? "Free"
                        : `💎 ${hat.cost}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {(options[tab] ?? []).map((value) => {
            const field = FIELD_FOR[tab as Exclude<TabKey, "hat">];
            const on = (preview[field] ?? "") === value;
            return (
              <li key={value}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => choose(field, value)}
                  title={value}
                  className={cn(
                    "grid w-full place-items-center rounded-xl border-2 p-1 transition-colors",
                    on ? "border-[#58c96a] bg-[#f2fbf4]" : "border-[#ece8fb] bg-white",
                  )}
                >
                  <StudentAvatar
                    seed={seed}
                    overrides={{ ...preview, [field]: value }}
                    size={tab === "stance" ? 74 : 56}
                    variant={tab === "stance" ? "full" : "bust"}
                    background={tab === "stance" ? null : "#f7f6fb"}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
