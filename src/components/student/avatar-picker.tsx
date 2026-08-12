"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, ChevronRight, RefreshCw } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { applyAvatarSeed, rollAvatarOptions } from "@/lib/actions/avatar";
import {
  Mono,
  OutlineButton,
  PageIntro,
  PageTitleSmall,
} from "@/components/student/ui";
import type { PeepConfig } from "@/lib/peeps";

/**
 * Avatar picker, ported from the prototype's AvatarPickerScreen: back row,
 * intro line, then 88px option rows (`styles.avatarOption`) each holding a
 * 62px avatar, a title, a caption and a trailing check/chevron. A reroll
 * button sits underneath.
 *
 * The characters are our real Open Peeps, not the prototype's initials circle.
 * Picking one only takes effect on confirm, so backing out changes nothing.
 */
export function AvatarPicker({
  studentId,
  currentSeed,
  currentOverrides,
}: {
  studentId: string;
  currentSeed: string;
  currentOverrides: Partial<PeepConfig>;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();

  async function roll() {
    setLoading(true);
    setChosen(null);
    const next = await rollAvatarOptions(3);
    setOptions(next.map((o) => o.seed));
    setLoading(false);
  }

  useEffect(() => {
    void roll();
  }, []);

  return (
    <div className="px-5 pb-[30px] pt-[18px]">
      <Link
        href={`/student/${studentId}/profile`}
        className="mb-2 flex min-h-[36px] items-center transition-opacity active:opacity-70"
      >
        <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
        <PageTitleSmall>Choose your avatar</PageTitleSmall>
      </Link>
      <PageIntro>Three fresh options — reroll anytime.</PageIntro>

      <div className="mb-4 flex items-center gap-3">
        <StudentAvatar
          seed={currentSeed}
          overrides={currentOverrides}
          size={48}
          shape="square"
          ring="var(--st-fg)"
          ringWidth={2}
          background="var(--st-peach)"
        />
        <Mono className="text-st-muted-fg">Wearing now</Mono>
      </div>

      {loading
        ? [0, 1, 2].map((i) => (
            <div
              key={i}
              className="mt-[11px] flex min-h-[88px] items-center rounded-[2px] border-2 p-3"
              style={{
                backgroundColor: "var(--st-card)",
                borderColor: "var(--st-input)",
              }}
            >
              <Mono className="text-st-muted-fg">Loading…</Mono>
            </div>
          ))
        : options.map((seed, i) => {
            const on = chosen === seed;
            return (
              <button
                key={seed}
                type="button"
                onClick={() => setChosen(seed)}
                className="mt-[11px] flex min-h-[88px] w-full items-center gap-[13px] rounded-[2px] border-2 p-3 text-left transition-opacity active:opacity-70"
                style={{
                  backgroundColor: "var(--st-card)",
                  borderColor: on ? "var(--st-secondary)" : "var(--st-fg)",
                }}
              >
                <StudentAvatar
                  seed={seed}
                  size={62}
                  shape="square"
                  ring={on ? "var(--st-secondary)" : "var(--st-fg)"}
                  ringWidth={2}
                  background="var(--st-peach)"
                />
                <span className="min-w-0 flex-1">
                  <span className="st-display mb-1 block text-[16px] text-st-fg">
                    Option {i + 1}
                  </span>
                  <Mono className="block text-st-muted-fg">
                    A new look for your learning journey
                  </Mono>
                </span>
                {on ? (
                  <CheckCircle
                    size={20}
                    style={{ color: "var(--st-secondary)" }}
                    aria-hidden
                  />
                ) : (
                  <ChevronRight
                    size={20}
                    style={{ color: "var(--st-muted-fg)" }}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}

      <OutlineButton onClick={() => void roll()} disabled={loading || pending}>
        <RefreshCw size={17} aria-hidden />
        Reroll avatars
      </OutlineButton>

      <button
        type="button"
        disabled={!chosen || pending}
        onClick={() =>
          start(async () => {
            try {
              await applyAvatarSeed(studentId, chosen!);
              toast.success("That's you now!");
              router.push(`/student/${studentId}/profile`);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not save");
            }
          })
        }
        className="st-mono mt-[11px] flex min-h-[50px] w-full items-center justify-center rounded-[2px] text-[12px] font-black uppercase tracking-[0.6px] transition-opacity active:opacity-70 disabled:opacity-40"
        style={{
          backgroundColor: "var(--st-primary)",
          color: "var(--st-primary-fg)",
        }}
      >
        {pending ? "Saving…" : "Use this one"}
      </button>

      <Mono className="mt-2 block text-center text-st-muted-fg">
        Picking a new character resets shop changes like hair and clothes.
      </Mono>
    </div>
  );
}
