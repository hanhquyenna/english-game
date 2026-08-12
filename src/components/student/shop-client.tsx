"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  Circle,
  Gem,
  Scissors,
  Smile,
  Square,
} from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { buyItem, setPeepOverride, toggleItem } from "@/lib/actions/avatar";
import { Mono, PageTitleSmall } from "@/components/student/ui";
import { ITEM_COLORS, type EquippedItem, type PeepConfig } from "@/lib/peeps";

/**
 * Avatar Shop, ported from the prototype's ShopScreen: back row with a gem
 * counter, a 132px bordered avatar stage, a scrolling row of icon+label tabs
 * (`styles.shopTab`), then either a 2-up hat grid or a row of option cards.
 *
 * Appearance tabs write straight to the character and are free. Hats are the
 * only place gems are spent.
 *
 * The prototype's fifth tab is "Shoes"; Open Peeps exposes no separately
 * colourable shoe layer, so this one picks the full-body stance — which does
 * visibly change the outfit and footwear in the preview — and is labelled for
 * what it actually does.
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

const TABS: { key: TabKey; label: string; Icon: typeof Scissors }[] = [
  { key: "hair", label: "Hair", Icon: Scissors },
  { key: "face", label: "Face", Icon: Smile },
  { key: "hat", label: "Hats", Icon: Award },
  { key: "clothes", label: "Clothes", Icon: Circle },
  { key: "stance", label: "Stance", Icon: Square },
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

  const fullBody = tab === "stance" || tab === "clothes";

  return (
    <div className="px-5 pb-[30px] pt-[18px]">
      <div className="mb-2 flex min-h-[36px] items-center">
        <Link
          href={`/student/${studentId}/profile`}
          aria-label="Back to profile"
          className="transition-opacity active:opacity-70"
        >
          <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
        </Link>
        <PageTitleSmall>Avatar Shop</PageTitleSmall>
        <span className="flex-1" />
        <span
          className="flex min-h-[34px] items-center gap-[5px] rounded-[2px] border-2 border-st-fg px-[9px]"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <Gem size={15} style={{ color: "var(--st-primary)" }} aria-hidden />
          <span className="text-[14px] font-black text-st-fg">{gems}</span>
        </span>
      </div>

      <div className="flex items-center justify-center py-[17px]">
        <span
          className="relative flex items-center justify-center rounded-[2px] border-2"
          style={{
            width: 132,
            height: fullBody ? 190 : 132,
            backgroundColor: "var(--st-card)",
            borderColor: "var(--st-primary)",
          }}
        >
          <StudentAvatar
            seed={seed}
            overrides={preview}
            items={items}
            size={fullBody ? 170 : 106}
            variant={fullBody ? "full" : "bust"}
            shape="square"
            ring={null}
            background={null}
          />
        </span>
      </div>

      <div className="flex gap-[7px] overflow-x-auto pb-[17px]">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex min-h-[35px] shrink-0 items-center gap-[5px] rounded-[2px] border-2 border-st-fg px-[11px] transition-opacity active:opacity-70"
              style={{
                backgroundColor: on ? "var(--st-primary)" : "var(--st-card)",
              }}
            >
              <t.Icon
                size={14}
                aria-hidden
                style={{
                  color: on ? "var(--st-primary-fg)" : "var(--st-muted-fg)",
                }}
              />
              <Mono
                style={{
                  color: on ? "var(--st-primary-fg)" : "var(--st-muted-fg)",
                }}
              >
                {t.label}
              </Mono>
            </button>
          );
        })}
      </div>

      {tab === "hat" ? (
        <div className="grid grid-cols-2 gap-3">
          {hats.map((hat) => (
            <button
              key={hat.id}
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
              className="flex flex-col items-center gap-[7px] rounded-[2px] border-2 p-3 transition-opacity active:opacity-70"
              style={{
                backgroundColor: "var(--st-card)",
                borderColor: hat.equipped
                  ? "var(--st-secondary)"
                  : "var(--st-fg)",
              }}
            >
              <span
                className="flex size-16 items-center justify-center rounded-[2px]"
                style={{ backgroundColor: "var(--st-fg)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/assets/items/${hat.icon}.svg`}
                  alt=""
                  className="size-[26px]"
                  style={{ color: ITEM_COLORS[hat.icon] ?? "var(--st-accent)" }}
                />
              </span>
              <Mono className="text-st-fg">{hat.label}</Mono>
              <Mono
                style={{
                  color: hat.owned
                    ? "var(--st-secondary)"
                    : "var(--st-primary)",
                }}
              >
                {hat.equipped
                  ? "Equipped"
                  : hat.owned
                    ? "Owned"
                    : hat.cost === 0
                      ? "Free"
                      : `${hat.cost} gems`}
              </Mono>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {(options[tab] ?? []).map((value) => {
            const field = FIELD_FOR[tab as Exclude<TabKey, "hat">];
            const on = (preview[field] ?? "") === value;
            return (
              <button
                key={value}
                type="button"
                disabled={pending}
                onClick={() => choose(field, value)}
                title={value}
                className="flex flex-col items-center gap-[7px] rounded-[2px] border-2 p-2.5 transition-opacity active:opacity-70"
                style={{
                  backgroundColor: "var(--st-card)",
                  borderColor: on ? "var(--st-secondary)" : "var(--st-fg)",
                }}
              >
                <StudentAvatar
                  seed={seed}
                  overrides={{ ...preview, [field]: value }}
                  size={tab === "stance" ? 76 : 58}
                  variant={tab === "stance" ? "full" : "bust"}
                  shape="square"
                  ring={null}
                  background="var(--st-peach)"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
