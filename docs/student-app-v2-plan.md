# Student app v2 — dev plan

Scope: everything brainstormed for Arena, skill-shuffled exercises, Vault
rework, chat/inbox, and avatar shop economy. Written against the app as it
stands after `c3676f0` (retro cream/terracotta `st-*` design system —
`Tile`/`Mono`/`PageTitle`/`BlockButton`/`StudentAvatar`, see
`src/components/student/ui.tsx`). Every new screen below should be built from
those primitives, not new ad-hoc markup — that's what "matches the existing
style" means in practice here.

Each section says: what's already real (data + code), what's new, and what to
fake with seed data for a demo vs. build for real. Nothing here is a database
migration yet — this is the thinking pass before that.

---

## 0. What's already there (don't rebuild this)

- **CEFR Level Engine** (`src/lib/level-engine.ts`): 5-input composite → A1–C2
  band. Real, tested, don't touch the formula without touching the tests.
- **Gems/XP/streak economy** (`src/lib/progression.ts`,
  `src/lib/actions/student.ts`): `XP_CORRECT=10`, `XP_INCORRECT=2`,
  `GEMS_PER_ROUND=15` paid out in `completePracticeRound`. Streak computed
  from real practice days, not stored as a raw counter.
- **Avatar shop pricing already exists**: `avatars.cost` column, seeded
  today with real numbers (`scripts/seed.ts`): Jester hat free (streak:3),
  Study cap 150 gems (streak:7), Crown 300 gems (streak:14), 30-day flame
  badge free (streak:30), Medal 100 gems (xp:250), Gem badge 200 gems
  (xp:500). Unlock rules (`streak:N`, `xp:N`, `cefr:X`, `always`) are
  data-driven (`isUnlocked` in `progression.ts`) — a new item is a seed row,
  not a code change.
- **Per-word/per-grammar-point mastery**: `vocab_mastery`, `grammar_mastery`
  tables, updated on every attempt, with `last_reviewed_at` — this is
  already the exact shape an SRS scheduler needs.
- **Islands = teacher-assigned topics only** (`src/lib/islands.ts`,
  `buildIslands`): 6 levels + 1 exam node per topic, unlocks sequentially.
  Node numbering currently resets per island (bug relative to "lesson 8, not
  lesson 1" — fix in §2).

---

## 1. Arena (unlimited path) + locked Leagues

**New nav entry.** Bottom nav currently has 5 items (`StudentShell`):
Learn / Challenges / Vault / Rank / Profile. Arena needs its own slot —
recommend replacing "Rank" as a standalone tab with an Arena tab that
contains Rank/Leaderboard as one of its sections, since Arena and Rank are
the same competitive surface. Keep the nav at 5 items; don't add a 6th
(`StudentShell`'s `nav` array is laid out for 5 — six will cramp the
390px-wide phone frame).

**Screen: Arena home** (`/student/[studentId]/arena`). Same page shell
pattern as `vault/page.tsx` (server component, `PageTitle` + `PageIntro`
header). Content: an unlimited scroll of `IslandBand`-style sections, but
sourced from a *library* of CEFR-tagged content instead of
`buildIslands(assignedTopics)`. Needs a genuinely new query:
`getArenaTopics(cefrBand)` — topics with no `class_id`/`assigned_at`
requirement, filtered to the student's current band (±1 band, so it's
never trivially easy or impossible).

**Data model addition**: `topics` currently requires `class_id`. Add
`topics.source` enum (`'school' | 'library'`) and make `class_id` nullable
for library topics. Library topics still get `cefr_level` (already a
column) — that's the filter. **Demo fallback**: seed 15–20 library topics
by hand across A1–C2 now; a real content pipeline (§3) fills this out later.

**Locking mechanic**: Arena's *practice* content is never locked — that's
the whole point (unlimited, no homework pressure). What's locked is the
competitive layer: a `leagues` feature (weekly reset, promotion/demotion,
reusing `tierForIndex` from `src/lib/tiers.ts` — Champion/Diamond/Gold/
Bronze already exist as a concept, just currently computed from an
all-time leaderboard rank rather than a weekly league). Gate entry to this
week's league behind `topic_progress` on assigned topics crossing some
threshold (e.g. "this week's homework ≥ 1 topic advanced") — computed
server-side, rendered as a locked `Tile` with an `OutlineButton` linking
back to Challenges, in the same visual language as a locked node in
`IslandBand` (padlock emoji, muted `st-muted-fg` text — see
`island-band.tsx`'s `!island.unlocked` branch for the pattern to copy).

**Gems**: Arena practice rounds pay out through the same
`completePracticeRound` action, same `GEMS_PER_ROUND=15` — no new economy
needed there. League placement at week's end is a new payout: propose
Champion 100 / Diamond 60 / Gold 30 / Bronze 10 gems, paid by a scheduled
job (out of scope for the demo — for the demo, a "claim your league reward"
button that pays out immediately is fine).

---

## 2. Continuous map numbering (small, do this first)

`island-band.tsx` renders `node.label` per-island, resetting each unit. Fix:
compute a running lesson index across *all* assigned islands before
rendering (`buildIslands` already returns an ordered array — add a global
counter when flattening `nodes` across islands, pass `globalIndex` down
instead of `node.level` for the label). Exam nodes don't get a lesson
number — keep those as the trophy icon, unnumbered, same as today.

---

## 3. Skill-shuffled exercises (4 skills × multiple formats)

**Schema addition — this is the real work here.** `exercises.type` today is
`MCQ | FILL_BLANK | MATCHING | VOCAB_CARD` — a *format*, with no *skill*
dimension. Add `exercises.skill` enum: `VOCAB | GRAMMAR | READING |
LISTENING | WRITING | SPEAKING`. Reading needs a `passage` field (or reuse
`content` jsonb — it already is jsonb, so this may just be a documented
shape, not a column). Listening needs an audio URL — generate via TTS at
content-creation time rather than sourcing recordings (cheap, no licensing
question, consistent CEFR-appropriate pace). Writing needs an open-text
response path (no `correct`/`incorrect` boolean — `exercise_attempts.correct`
is currently a plain boolean, which doesn't fit; writing/speaking attempts
need a `score` or `pending_review` state instead). Speaking needs an audio
upload from the student + either an ASR/pronunciation-scoring API or
teacher review — for the demo, route speaking to teacher review only (reuse
the existing gradebook grading pattern), skip auto-scoring.

**Session generator**: a pure function (same style as `level-engine.ts` —
no I/O, unit-testable) that takes a pool of exercises tagged
`{skill, type}` and returns an ordered session where no two consecutive
items share a `type`, and skill coverage is balanced across the session
unless `weakestInput()` says to bias toward one skill. This slots into
`practice-session.tsx`'s existing exercise-fetching logic — the component
that renders one exercise at a time already exists, only the *selection*
of which exercises and what order is new.

**Demo fallback**: seed a handful of reading/listening/writing/speaking
items per topic by hand (2–3 each) so the shuffle has something real to
show; full four-skill coverage per topic is a content-pipeline problem
(§Arena, "library topics"), not a UI problem.

---

## 4. Vault rework: sections + flashcards

Current `vault/page.tsx` is a flat unit list → tap in → vocab/grammar tag
chips. Add tabs at the top of the Vault home screen using the same tab
pattern already built in `shop-client.tsx` (`TABS.map` → pill buttons,
active state via `background: st-primary`, copy that pattern exactly
rather than inventing a new tab component):

- **Materials** — today's screen as-is (unit → vocab/grammar chips).
- **My Vocab** — every vocab item across all assigned units, filterable by
  mastered/not-mastered (`MASTERY_THRESHOLD` already exists), independent
  of which unit it came from.
- **My Grammar** — same, for grammar points.
- **This Week** — `vocab_mastery`/`grammar_mastery` rows where
  `last_reviewed_at` falls in the current ISO week. Pure query, no new
  table.
- **Scores** — pulls `submissions` (already has `score`, `exam_id`) joined
  to `exams.title`/`topic_id`, listed same as the Challenges tab's
  DONE/PENDING chips (`StatusChip` component already exists in `ui.tsx` —
  reuse it here instead of building a new score row style).

**Flashcard/SRS practice mode**: a new screen,
`/student/[studentId]/vault/review`. Algorithm: SM-2 (well-documented,
small to implement) scheduling off `mastery_score` +
`last_reviewed_at` — items overdue for review surface first. This is a new
*screen* over data that already exists; no new mastery tracking needed,
just a scheduler and a card-flip UI (reuse `Tile` for the card face, same
2px-border/hard-shadow look as everywhere else).

**Gems**: propose a weekly bonus — clearing everything "due" in Vault
Review once in a calendar week pays +20 gems, tracked by a simple
`last_vault_review_bonus_at` timestamp on `student_avatars` (or derived
from `study_sessions` if you'd rather not add a column — either works for
the demo).

---

## 5. Inbox / chat

Given these are school-age students, keep peer interaction inside monitored
threads rather than open DMs — this is a real safety constraint, not just a
style choice.

- **Teacher ↔ student, 1:1**: lowest-risk, clearly useful (asking about
  homework). New table `messages` (`thread_id`, `sender_id`, `body`,
  `created_at`); thread scoped to `(teacher_id, student_id)` pair per class.
- **Class-wide**: `class_posts` already exists and is exactly this —
  extend it with a reply/comment thread rather than building a second
  system. Canva's model (comments threaded on an object) fits naturally:
  thread the comments on the `class_post` itself, or on a specific
  `topic`/`exam`, not in a freeform inbox.
- **Nav placement**: the header already has a notification bell concept
  (`notifications` table, `NOTIFICATION_LABELS` in `personas.ts`) — unify
  inbox and notifications behind one icon in `StudentShell`'s header rather
  than adding a new bottom-nav slot (ties back to the 5-tab constraint in
  §1).
- **Demo fallback**: seed a few sample messages/threads; realtime delivery
  can reuse the existing `useRealtimeRefresh` hook pattern already used
  elsewhere in `student-shell.tsx`.

---

## 6. Avatar shop — extending the pricing

Today only hats/badges cost gems; hair/face/clothes/stance are free by
deliberate design (`shop-client.tsx` comment: "Appearance tabs write
straight to the character and are free"). Two ways to add more "special
things with prices" without breaking that stated intent:

- **More paid hats/badges** — cheapest option, same pattern, just more
  seed rows: e.g. a seasonal hat (250 gems, `unlock_rule: 'always'`, i.e.
  purely gem-gated, no streak/xp requirement), a "top of the league" crown
  variant tied to Arena league placement (`unlock_rule` would need a new
  kind beyond streak/xp/cefr — e.g. `league:champion` — small addition to
  `isUnlocked()`'s switch statement).
- **Premium appearance items** — a bigger change: `EquippedItem.slot` is
  currently typed `"hat" | "badge"` only (`src/lib/peeps.ts`). Widening
  that to include e.g. a rare hair style or outfit as a paid unlockable
  means extending the slot type and `shop-client.tsx`'s per-tab rendering
  to check ownership the same way the hat tab already does, instead of
  writing straight to the character for free. Recommend deciding this one
  with you directly before building — it changes an existing UX promise
  ("customize your look for free"), not just adds content.

---

## 7. Suggested build order

1. Continuous map numbering (§2) — small, unblocks Arena feeling like one
   journey rather than six.
2. Vault rework (§4) — mostly reads of data that already exists, lowest
   schema risk.
3. Skill/exercise schema (§3) — the biggest data model change; everything
   else (Arena content, exam skill coverage) depends on it existing first.
4. Arena + locked leagues (§1) — depends on §3 for content variety.
5. Shop pricing extension (§6) — small, can slot in anytime once you've
   decided the free-appearance-tabs question.
6. Inbox/chat (§5) — independent of the above, can run in parallel.
