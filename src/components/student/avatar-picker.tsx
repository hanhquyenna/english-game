"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { StudentAvatar } from "@/components/student-avatar";
import { applyAvatarSeed, rollAvatarOptions } from "@/lib/actions/avatar";
import type { PeepConfig } from "@/lib/peeps";
import { cn } from "@/lib/utils";

/**
 * Three fresh characters to choose from, with a reroll — the design's picker.
 *
 * The student's existing character is only replaced when they confirm a choice,
 * so backing out leaves them exactly as they were.
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
    <div>
      <h1 className="mt-2 font-display text-xl font-extrabold text-[#2a2540]">
        Choose your character
      </h1>
      <p className="text-[13px] text-[#8b83c4]">
        Your character stays the same everywhere — on your profile, the ranking
        and your teacher&rsquo;s screen.
      </p>

      <div className="mt-4 rounded-2xl border border-[#ece8fb] bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#a9a3cf]">
          Wearing now
        </p>
        <div className="mt-2 flex justify-center">
          <StudentAvatar
            seed={currentSeed}
            overrides={currentOverrides}
            size={96}
            ring="#d3caf7"
          />
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {loading
          ? [0, 1, 2].map((i) => (
              <li
                key={i}
                className="grid h-32 place-items-center rounded-2xl border-2 border-[#ece8fb] bg-[#faf9ff] text-[#c9c3e6]"
              >
                …
              </li>
            ))
          : options.map((seed, i) => (
              <li key={seed}>
                <button
                  type="button"
                  onClick={() => setChosen(seed)}
                  className={cn(
                    "flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition-colors",
                    chosen === seed
                      ? "border-[#58c96a] bg-[#f2fbf4]"
                      : "border-[#ece8fb] bg-white",
                  )}
                >
                  <StudentAvatar seed={seed} size={72} background="#f7f6fb" />
                  <span className="text-[11.5px] font-bold text-[#8b83c4]">
                    Option {i + 1}
                  </span>
                </button>
              </li>
            ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => void roll()}
          disabled={loading || pending}
          className="flex-1 rounded-xl border border-[#ece8fb] py-3 text-[13px] font-bold text-[#534ab7] disabled:opacity-50"
        >
          🎲 Show me three more
        </button>
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
          className="flex-1 rounded-xl bg-[#534ab7] py-3 text-[13px] font-bold text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "Use this one"}
        </button>
      </div>

      <p className="mt-2 text-center text-[11.5px] text-[#a9a3cf]">
        Picking a new character resets shop changes like hair and clothes.
      </p>
    </div>
  );
}
