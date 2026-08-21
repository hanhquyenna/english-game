# Cheppy — Competitive Teardown & Ideas Worth Stealing

Live walkthrough of Cheppy.ai (kids' English learning app, Vietnam market) on August 15, 2026. Covers the full student flow: home map, School, Mission, Practice, Playground (Role Play / Fun Stories / Phonics / Talk Card), and Leaderboard. "My Buddy" hit a dead-end loading bug and never opened.

## The big structural idea: one content pool, three wrappers

This is the thing most worth copying. Cheppy has a single bank of curriculum content (units, stages, questions) and re-skins it into three different entry points:

- **My School** — the "serious" path. Class roster → unit list → stage → exercises. No narrative, just direct access, framed as a school building with a teacher and classmates.
- **Mission** — the exact same units, but re-skinned as a winding Candy-Crush-style path map with a light story premise ("Let's bake a cake") and numbered nodes. Same questions, same stages, just a different emotional wrapper.
- **Practice** — the same question bank again, but sliced two new ways: by mistake history (Mistake Reviewing) and by skill tag (Skill Boosting).

So the actual authoring burden is one content pipeline, and they get four distinct-feeling game modes out of it (direct study, adventure-map progression, error-driven review, skill-targeted drilling). That's a very efficient design — worth stealing outright. If your app tags every question with unit + skill + difficulty at creation time, you get all four modes almost for free.

## Exercise format variety (all seen in one 12-question lesson)

In a single unit run I hit four different interaction types back to back, which keeps a young learner from getting bored inside one lesson:

1. Word-order fill-in-blank — tap words from a bank into blanks in a sentence, image prompt above.
2. Audio-to-text matching — tap an audio icon, tap the text you think it says, a connecting line draws between matched pairs; wrong answers get a "show answer" reveal with a crossed-line overlay so the kid sees what they *should* have matched.
3. Word-order with a narrator character reading the prompt aloud (TTS avatar with speech bubble + audio button) instead of a plain instruction line.
4. Listening + dropdown-select — audio-only prompt, pick the missing word from a dropdown rather than a word bank.

All four types share one shell: same header (question counter, progress bar, hearts/infinity lives, flag-to-report, currency badge), same submit button placement, same correct/wrong feedback screen (green mascot thumbs-up / red mascot head-scratch, with a "Continue" and, on wrong answers, "Show answer"). Worth stealing: build one exercise *shell* and swap only the interaction widget inside it — that's clearly how they keep dev velocity up while feeling varied to the user.

Also notable: hearts are capped visually but paired with an infinity symbol — i.e., no real penalty for wrong answers, unlimited attempts, unlimited time, unlimited deadline on every stage I checked. This is a kids' app choosing zero failure-anxiety over Duolingo-style scarcity. Good signal if your audience is also young / low frustration-tolerance.

## The mastery loop (Practice tab) — this is the strongest single idea

Practice splits into two modes that most competitors don't bother separating:

- **Mistake Reviewing**: automatically aggregates every question you've ever gotten wrong, across every unit, into one on-demand session, with an upfront estimate ("14 questions, 7 minutes") and a flat reward (700 EXP + 70 currency) shown before you commit. This is a proper spaced-repetition/error-correction loop, presented as a low-effort, well-scoped task rather than an abstract "review your mistakes" nag.
- **Skill Boosting**: a skill-select screen with seven independently tracked competencies — Reading, Speaking, Pronunciation, Vocabulary, Grammar, Listening, Writing — each with its own 5-star mastery rating. You multi-select which skills you want to drill, hit Continue, and it assembles a mixed quiz targeting just those tags, again with a time/reward estimate upfront.

Two things worth stealing here: (1) skill-tagging every question against 7 named competencies gives you a mastery dashboard almost for free, and it's a much richer progress signal than a single XP number; (2) showing "X questions, Y minutes, Z reward" *before* the user commits to a practice session is a small but real friction-reducer — it turns "should I practice?" into a quick cost/benefit glance instead of an open-ended commitment.

## Role Play — AI conversation practice, task-checklist framed

This is the flagship "wow" feature and it's built simply but effectively:

- Pick a topic card (House Tour, My classroom, My lunch, or a "mystery die" for a random topic).
- Get a role card up front: "You are: Student / Cheppy: Teacher", a one-line mission ("Talk about your classroom"), and a currency reward — all before you commit, same pattern as Practice.
- Inside the conversation: a persistent TASKS checklist (3 short, concrete sub-goals like "Say one school thing," "Say what you use them for," "Describe where it is") that presumably tick off as the AI detects you've hit them, a big mic button, a transcript box, a CC (captions) toggle, and a hint (lightbulb) button — plus a flag icon to report the conversation and a language toggle.

Worth stealing: decomposing "have a conversation" into 3 visible, checkable micro-goals is what makes open-ended AI speaking practice feel achievable to a kid instead of intimidating. A blank "just talk to the AI" screen is much scarier than a checklist you're visibly completing. The hint + captions toggles are also a good accessibility/confidence net for weaker speakers without breaking immersion for stronger ones.

## Fun Stories — interactive reading with a streak hook

A bookshelf UI with Hard/Easy/Topic filters, illustrated fable titles (Aesop-style: Ant and Grasshopper, Town Mouse and Field Mouse, etc., plus some original moral stories). Opening a book shows a cover with genre + numeric level, then a page-by-page reader with a real illustration, narrated audio, and **word-by-word highlight-as-read** (karaoke-style TTS sync) — a strong, proven reading-fluency technique that's cheap to build once you have TTS timing data.

The retention hook is explicit and stated on-screen: "Read a page, earn a pearl. Keep the streak alive." — tying reading directly to the same currency as everything else, plus a streak mechanic, rather than treating stories as a disconnected content library.

## Gamification / social layer

- **Home map**: a single illustrated village scene where every feature is a physical building/location (school, mission gate, practice hut, playground, leaderboard shrine, a "buddy" pond) rather than a tab bar. Level badge + XP bar + soft currency + notification bell sit persistently in the header.
- **Leaderboard**: two tabs — Class (your actual classmates, podium visualization for top 3 with treasure-chest icons, then a ranked list) and Grade (a cross-cohort "Tier" league, e.g. "Tier: 58" — implies many parallel leaderboard buckets/leagues rather than one global list, which is how you keep leaderboards meaningful at scale instead of a new user always being #4,000,000).
- **Mascot as feedback layer**: the same dragon/fish-hat mascot character shows up everywhere — correct/wrong exercise feedback, quit-confirmation dialogs, practice-mode selection, story narration — giving the whole app one consistent emotional throughline instead of generic system dialogs. Worth stealing: a single mascot with a small set of expressive poses (celebrating, confused/embarrassed, thinking, waving) reused across every surface is cheap and very effective at making a kids' app feel warm.

## Weak points / gaps (also useful — tells you where they're behind)

- **Phonics** and **Talk Card** are both live, tapped, teased entry points on the Playground screen that just show a "Coming Soon: Smarter, Faster, Better English!" splash. They've shipped the UI/marketing surface before the feature — a legitimate teaser tactic, but also means phonics and structured conversation-card practice are open ground.
- **My Buddy** (the pet/companion feature implied by the home-map pond icon) is completely broken — infinite loading spinner, never resolved after several minutes across app restarts. Either an unshipped feature with a placeholder screen left live, or a genuine bug. Either way, a pet/companion mechanic is teased (icon + counter on the home screen) but not delivered — that's a specific, validated-by-a-competitor idea (virtual pet tied to learning progress) you could actually ship.
- Everything I saw was zero-penalty (infinite hearts/attempts/time) — fine for retention, but it means they have no visible difficulty-scaling or stakes mechanic. If your product wants more "game" tension, that's a gap.

## Quick-hit list of stealable mechanics

- Tag content once by unit *and* skill *and* difficulty → auto-generate multiple game modes (direct study path, adventure map, mistake review, skill drill) from the same bank.
- One shared exercise shell/header/feedback pattern, swap only the interaction widget — cuts dev cost while feeling varied.
- Show cost/time/reward ("14 questions · 7 min · +700 EXP") before any practice or mission session starts.
- Decompose open-ended AI speaking practice into 3 visible, tickable micro-goals instead of a blank chat box.
- Word-by-word TTS highlight sync for read-aloud stories.
- Explicit "action → currency" streak messaging stated in-copy, not just implied by a number going up.
- Tiered/bucketed leaderboards (leagues) instead of one global rank, so everyone's near the top of *something*.
- One recurring mascot with a handful of poses reused everywhere for feedback, dialogs, and narration.
- Ship a teaser tile for a not-yet-built feature ("Coming Soon") to gauge interest/build anticipation — but make sure it never gets tapped into a dead loading state (their bug, your lesson).
- Companion/pet mechanic tied to progress — teased by Cheppy, not delivered — genuinely open for you to build well.
