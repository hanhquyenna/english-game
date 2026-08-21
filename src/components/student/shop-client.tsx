"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { showToast } from "@/lib/toast-store";
import {
  ArrowLeft,
  Award,
  Gem,
  Lock,
  Check,
  Sparkles,
  User,
  Activity,
} from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { buyItem, toggleItem } from "@/lib/actions/avatar";
import { Mono, PageTitleSmall } from "@/components/student/ui";
import { StateButton } from "@/components/ui/button-state";
import { ITEM_COLORS, type EquippedItem } from "@/lib/peeps";
import { npcSrc, type NpcCharacter } from "@/components/student/kenney-story-dialog";

type Hat = {
  id: string;
  label: string;
  icon: string;
  slot: "hat" | "badge";
  cost: number;
  owned: boolean;
  equipped: boolean;
};

type TabKey = "character" | "poses" | "hats";

const TABS: { key: TabKey; label: string; Icon: typeof User }[] = [
  { key: "character", label: "Character", Icon: User },
  { key: "poses", label: "Poses", Icon: Activity },
  { key: "hats", label: "Accessories & Hats", Icon: Award },
];

const COMPANIONS: { id: NpcCharacter; label: string; role: string }[] = [
  {
    id: "Female adventurer",
    label: "Female Adventurer",
    role: "Explorer & Guide",
  },
  {
    id: "Female person",
    label: "Female Student",
    role: "Learning Companion",
  },
  {
    id: "Male adventurer",
    label: "Male Adventurer",
    role: "Explorer & Guide",
  },
  {
    id: "Male person",
    label: "Male Student",
    role: "Learning Companion",
  },
  {
    id: "Robot",
    label: "Cyber Robot",
    role: "AI Study Buddy",
  },
  {
    id: "Zombie",
    label: "Friendly Zombie",
    role: "Fun Monster Buddy",
  },
];

const POSES = [
  { id: "idle", label: "Idle" },
  { id: "cheer0", label: "Cheer" },
  { id: "talk", label: "Talk" },
  { id: "think", label: "Think" },
  { id: "jump", label: "Jump" },
  { id: "walk0", label: "Walk" },
];

export function ShopClient({
  studentId,
  seed,
  overrides,
  items,
  gems,
  hats,
}: {
  studentId: string;
  seed: string;
  overrides?: any;
  items: EquippedItem[];
  gems: number;
  activeTab?: string;
  options?: Record<string, string[]>;
  hats: Hat[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("character");

  // Main character selection
  const [selectedCharacter, setSelectedCharacter] =
    useState<NpcCharacter>("Female adventurer");
  const [selectedPose, setSelectedPose] = useState("cheer0");

  const [selectedHatId, setSelectedHatId] = useState<string | null>(null);
  const [buyDialogHat, setBuyDialogHat] = useState<Hat | null>(null);
  const [, start] = useTransition();

  const handleApplyChanges = async () => {
    try {
      showToast(`Selected ${selectedCharacter} as your main character!`, "success");
      return true;
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to apply changes",
        "error",
      );
      return false;
    }
  };

  const handleBuyHat = async (hat: Hat) => {
    if (gems < hat.cost) {
      showToast(`Not enough Gems! You need ${hat.cost} gems to purchase.`, "error");
      setBuyDialogHat(null);
      return false;
    }

    try {
      await buyItem(studentId, hat.id);
      showToast(`Successfully unlocked ${hat.label}!`, "success");
      setBuyDialogHat(null);
      router.refresh();
      return true;
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Item purchase failed",
        "error",
      );
      return false;
    }
  };

  const handleToggleHat = async (hat: Hat) => {
    try {
      setSelectedHatId(hat.id);
      await toggleItem(studentId, hat.id);
      showToast(
        hat.equipped ? `Unequipped ${hat.label}` : `Equipped ${hat.label}`,
        "info",
      );
      router.refresh();
      return true;
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Operation failed",
        "error",
      );
      return false;
    }
  };

  return (
    <div className="px-5 pb-[30px] pt-[18px]">
      {/* Top Navigation */}
      <div className="mb-3 flex min-h-[36px] items-center">
        <Link
          href={`/student/${studentId}/account`}
          aria-label="Back to account"
          className="transition-opacity active:opacity-70"
        >
          <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
        </Link>
        <PageTitleSmall>Avatar Shop</PageTitleSmall>
        <span className="flex-1" />
        <span
          className="flex min-h-[34px] items-center gap-[5px] rounded-[2px] border-2 border-st-fg px-[9px] shadow-sm"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <Gem size={15} style={{ color: "var(--st-primary)" }} aria-hidden />
          <span className="text-[14px] font-black text-st-fg">{gems}</span>
        </span>
      </div>

      {/* Main Character Hero Display Stage */}
      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <div
          className="relative flex flex-col items-center justify-center rounded-2xl border-4 border-st-fg bg-st-peach p-3 shadow-xl overflow-hidden"
          style={{ width: 170, height: 210 }}
        >
          <img
            src={npcSrc(selectedPose, selectedCharacter)}
            alt={selectedCharacter}
            className="h-36 object-contain animate-bounce"
          />
          <Mono className="mt-2 text-[10px] font-black text-st-primary uppercase text-center truncate w-full">
            {selectedCharacter}
          </Mono>
        </div>

        <StateButton
          onClickAction={handleApplyChanges}
          className="px-6 py-2 font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-2 border-st-fg"
          style={{
            backgroundColor: "var(--st-primary)",
            color: "var(--st-primary-fg)",
          }}
        >
          <Sparkles className="w-4 h-4 mr-1.5" /> Apply Changes
        </StateButton>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-[7px] overflow-x-auto pb-[17px] scrollbar-none">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex min-h-[36px] flex-1 shrink-0 items-center justify-center gap-[6px] rounded-lg border-2 px-3 text-xs font-black uppercase transition-all ${
                on
                  ? "bg-st-primary text-st-primary-fg border-st-fg shadow-md"
                  : "bg-st-card border-st-fg text-st-fg hover:opacity-80"
              }`}
            >
              <t.Icon size={14} aria-hidden />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[260px]">
        {/* CHARACTER SELECTION TAB */}
        {tab === "character" ? (
          <div className="grid grid-cols-2 gap-3">
            {COMPANIONS.map((comp) => {
              const isSelected = selectedCharacter === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => {
                    setSelectedCharacter(comp.id);
                    setSelectedPose("cheer0");
                  }}
                  className={`flex flex-col items-center justify-between rounded-xl border-2 p-3 transition-all transform active:scale-95 ${
                    isSelected
                      ? "border-st-fg bg-st-peach shadow-lg ring-2 ring-st-primary"
                      : "border-st-fg bg-st-card hover:opacity-80"
                  }`}
                >
                  <div className="h-28 w-full flex items-center justify-center rounded-lg bg-st-bg/80 relative overflow-hidden">
                    <img
                      src={npcSrc("idle", comp.id)}
                      alt={comp.label}
                      className="h-24 object-contain"
                    />
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 p-1 bg-st-primary rounded-full text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <Mono className="text-xs font-black text-st-fg mt-2 truncate w-full text-center">
                    {comp.label}
                  </Mono>
                  <Mono className="text-[9px] text-st-muted-fg font-bold truncate w-full text-center">
                    {comp.role}
                  </Mono>
                </button>
              );
            })}
          </div>
        ) : tab === "poses" ? (
          /* POSES SELECTION TAB */
          <div className="grid grid-cols-3 gap-3">
            {POSES.map((pose) => {
              const isSelected = selectedPose === pose.id;
              return (
                <button
                  key={pose.id}
                  type="button"
                  onClick={() => setSelectedPose(pose.id)}
                  className={`flex flex-col items-center justify-between rounded-xl border-2 p-3 transition-all transform active:scale-95 ${
                    isSelected
                      ? "border-st-fg bg-st-peach shadow-lg ring-2 ring-st-primary"
                      : "border-st-fg bg-st-card hover:opacity-80"
                  }`}
                >
                  <div className="h-24 w-full flex items-center justify-center rounded-lg bg-st-bg/80 relative overflow-hidden">
                    <img
                      src={npcSrc(pose.id, selectedCharacter)}
                      alt={pose.label}
                      className="h-20 object-contain"
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 p-0.5 bg-st-primary rounded-full text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <Mono className="text-xs font-black text-st-fg mt-1 uppercase text-center">
                    {pose.label}
                  </Mono>
                </button>
              );
            })}
          </div>
        ) : (
          /* HATS & ACCESSORIES TAB */
          <div className="grid grid-cols-2 gap-3">
            {hats.map((hat) => {
              const isSelected = selectedHatId === hat.id || hat.equipped;
              return (
                <button
                  key={hat.id}
                  type="button"
                  onClick={() => {
                    if (!hat.owned) {
                      setBuyDialogHat(hat);
                    } else {
                      handleToggleHat(hat);
                    }
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all transform active:scale-95 aspect-[4/5] justify-between ${
                    isSelected
                      ? "border-st-fg bg-st-peach shadow-lg ring-2 ring-st-primary"
                      : "border-st-fg bg-st-card hover:opacity-80"
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center w-full aspect-square bg-st-bg rounded-lg relative overflow-hidden">
                    <img
                      src={`/assets/items/${hat.icon}.svg`}
                      alt={hat.label}
                      className="size-10 object-contain"
                      style={{
                        color: ITEM_COLORS[hat.icon] ?? "var(--st-accent)",
                      }}
                    />
                    {!hat.owned && (
                      <span className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-md text-st-accent">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <Mono className="text-xs font-bold text-st-fg truncate w-full text-center">
                    {hat.label}
                  </Mono>

                  <div className="text-xs font-black">
                    {hat.equipped ? (
                      <span className="text-st-secondary flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : hat.owned ? (
                      <span className="text-st-primary">Owned</span>
                    ) : (
                      <span className="text-st-primary flex items-center gap-1">
                        <Gem className="w-3.5 h-3.5" /> {hat.cost} gems
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase Confirmation Dialog */}
      {buyDialogHat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="border-2 border-st-fg p-5 rounded-2xl w-full max-w-xs shadow-2xl text-center space-y-4"
            style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
          >
            <div
              className="mx-auto size-14 border-2 border-st-fg rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--st-peach)" }}
            >
              <Gem className="w-8 h-8" style={{ color: "var(--st-primary)" }} />
            </div>

            <div>
              <h4 className="st-display text-lg font-black text-st-fg">
                Confirm Purchase
              </h4>
              <p className="text-xs text-st-muted-fg mt-1">
                Are you sure you want to spend{" "}
                <strong className="text-st-primary">
                  {buyDialogHat.cost} Gems
                </strong>{" "}
                to unlock{" "}
                <strong className="text-st-fg">{buyDialogHat.label}</strong>?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <StateButton
                onClickAction={() => handleBuyHat(buyDialogHat)}
                className="flex-1 font-black text-xs uppercase border-2 border-st-fg"
                style={{
                  backgroundColor: "var(--st-primary)",
                  color: "var(--st-primary-fg)",
                }}
              >
                Buy Now
              </StateButton>
              <button
                type="button"
                onClick={() => setBuyDialogHat(null)}
                className="px-4 py-2 border-2 border-st-fg text-st-fg font-bold rounded-xl text-xs uppercase"
                style={{ backgroundColor: "var(--st-bg)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
