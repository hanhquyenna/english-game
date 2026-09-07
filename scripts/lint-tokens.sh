#!/usr/bin/env bash
# Beeblast design-system gate.
#
# Two rules, both already mandated in writing:
#   Beeblast_FIX_DesignSystem_ClassPicker_KidUX_v1.md §1.4 — no default Tailwind
#     palette classes anywhere in src; the app has no dark mode, so there is no
#     reason for a dark surface to exist.
#   Beeblast_FRS_KenneyWorldSkin_v1.md §2.1 — no emoji as UI icons in the
#     student app; emoji render differently per OS and never match lucide.
#
# Both rules were written down twice and drifted anyway, because a colour token
# is not a failing test. This script makes it one.
set -uo pipefail

# grep -P needs a UTF-8 locale or the emoji ranges silently match nothing —
# i.e. the gate passes while violations remain. Do not remove this line.
export LC_ALL=C.UTF-8

fail=0

# Colour classes only — matched with a Tailwind prefix so words like
# "gray-scale" in prose or a `slate-` inside a URL do not trip the gate.
PALETTE='(^|[^a-zA-Z0-9-])(bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|decoration|divide|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|sky|rose|amber|emerald|lime|teal|cyan|indigo|violet|fuchsia|pink|red|orange|yellow|green|blue|purple)-[0-9]{2,3}'

echo "==> checking for default Tailwind palette classes in src/"
if hits=$(grep -rnE "$PALETTE" src --include='*.tsx' --include='*.ts' --include='*.css' 2>/dev/null); then
  count=$(printf '%s\n' "$hits" | grep -c .)
  echo "$hits"
  echo "FAIL: $count default-palette usages. Use st-* tokens from src/app/globals.css."
  fail=1
else
  echo "OK: none."
fi

echo "==> checking for emoji in the student app"
if hits=$(grep -rnP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}\x{2B00}-\x{2BFF}]' \
      src/app/student src/components/student 2>/dev/null); then
  count=$(printf '%s\n' "$hits" | grep -c .)
  echo "$hits"
  echo "FAIL: $count emoji. Use lucide-react icons or Kenney tiles."
  fail=1
else
  echo "OK: none."
fi

# Rule 3: st-* tokens are declared ONLY inside [data-persona="student"] in
# globals.css. Used on a teacher or parent surface they resolve to nothing and
# the declaration is dropped, so the element renders unstyled rather than
# wrong-coloured. This is a silent failure with no console error, which is
# exactly why it needs a gate.
echo "==> checking for student-only st-* tokens outside the student app"
ST='(^|[^a-zA-Z0-9-])(bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|divide|placeholder)-st-|var\(--st-'
if hits=$(grep -rnE "$ST" src --include='*.tsx' --include='*.ts' \
      | grep -vE '^src/(app|components)/student/' 2>/dev/null); then
  count=$(printf '%s\n' "$hits" | grep -c .)
  echo "$hits"
  echo "FAIL: $count st-* usages outside the student app. Use base tokens (bg-card, text-foreground, border-border, bg-muted) or persona tokens (bg-persona, bg-persona-soft) instead."
  fail=1
else
  echo "OK: none."
fi

[ "$fail" -eq 0 ] && echo "design-system gate: PASS" || echo "design-system gate: FAIL"
exit $fail
