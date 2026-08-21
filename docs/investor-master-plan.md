# Beeblast — master plan

Everything below is checked directly against the codebase, not aspirational
copy. Each section marks what is real and running today versus what is
actively being built versus what is roadmap. That distinction matters for
diligence — this document should survive an investor's engineer actually
opening the repo.

---

## The one-sentence pitch

Beeblast is the English-learning platform for Vietnamese schools where a
student's level is a real, internationally recognized CEFR score computed
from what they actually do, not a marketing number, and where that same
number is what a teacher assigns against and a parent sees move in real
time.

---

## The core insight

Ed-tech for schools tends to split into two products that don't talk to
each other: a gamified consumer app (Duolingo) that has no idea what a
specific class is studying this week, or a school LMS that tracks
homework and grades but has no reason for a kid to open it twice a day.
Schools need curriculum fidelity. Students need a reason to come back
without being told to. Most products pick one and bolt the other on
badly.

Beeblast's architecture is built so both are true at once, for the same
number. A student's CEFR composite is fed by five real inputs — hours,
vocabulary mastery, exam scores, curriculum coverage, grammar mastery —
and curriculum coverage stays strictly tied to what the teacher assigned,
while the other four inputs can also be earned through self-directed
practice. A student grinding extra practice for fun and a student
finishing homework on time are both legitimately moving the same,
real number. That is the product's actual moat: not the game mechanics
and not the curriculum tooling alone, but that they are the same system
rather than two systems glued together.

---

## What is built and running today

Verified against the codebase directly, not summarized from memory.

**The Level Engine.** A pure, unit-tested module that takes five inputs
and outputs an actual CEFR band, A1 through C2 — the same framework
Cambridge and IELTS score against, not an invented app-only number. Every
recompute is stored as a timestamped historical row, so trend-over-time
is already free data, not a future feature.

**The student app.** A full gamified path: an island map of assigned
units (six practice levels plus one exam node per unit, matching how a
real course is chaptered), a practice engine that scores vocabulary and
grammar mastery per attempt, a streak computed from actual practice days
rather than a counter that can be gamed, a gems and XP economy that pays
out on real completions, an avatar system built on Open Peeps — an
open-licensed, ethically sourced illustration set — curated specifically
to exclude anything inappropriate for a children's product, a leaderboard
with tiered ranks, and a shop with real gem pricing tied to real unlock
rules (streak milestones, XP thresholds, CEFR bands).

**The teacher app.** Class and student roster management, a curriculum
builder (vocabulary, grammar, exercises per unit), assignment to class,
a gradebook wired to real exam submissions, a kudos and recognition
system that notifies students and parents immediately, and a class feed
where a teacher's post and a student's submitted journal entry with the
teacher's written feedback are both visible to parents. Per-student,
per-word and per-grammar-point mastery is already tracked at the database
level for every student — the data exists today; only the teacher-facing
view of it is still being built.

**Cross-persona realtime.** The three apps are not three separate
products sharing a login. They subscribe to the same underlying tables,
so a parent watching their own screen sees a number move while their
child is still mid-practice on a different device. This is a real
technical property of the system, not a demo trick — it comes from
Postgres realtime publication on the tables that matter, wired once, at
the data layer.

**Vietnamese-first, properly.** Full Vietnamese diacritic support was a
deliberate typography decision, not an afterthought — the product
explicitly avoided a default font that would silently drop Vietnamese
characters to a broken fallback in exactly the screens that matter.
Teacher and parent copy is Vietnamese throughout; the product is being
built for the market it's in, not translated into it after the fact.

---

## What is actively being built right now

Not roadmap slides — this is mid-implementation in the codebase as of
this writing: skill-tagged exercises (vocabulary, grammar, reading,
listening, writing, speaking, instead of vocabulary and grammar only,
which is what makes exam results map onto the four-skill structure real
international exams actually use), a split between school-assigned and
open-library content so self-directed practice and curriculum-assigned
practice can coexist without corrupting what "curriculum coverage" means,
a teacher-to-student messaging system and threaded comments on class
posts, and a full visual and structural pass on the teacher app —
a clean, shadcn-built interface using the same brand color as the student
app, organized into grouped navigation, landing on a dashboard rather
than a raw roster, instead of a plain, unstyled admin panel.

---

## What's next (near-term roadmap)

**Arena and leagues.** An unlimited, always-open practice track separate
from the assigned curriculum, so a student's desire to compete with
friends "based on international level" doesn't depend on having homework
to do. The competitive layer — weekly leagues, promotion and demotion —
is gated behind staying current on assigned coursework, which is the
retention lever: the fun part is the reward for the disciplined part, not
a separate app.

**A real content pipeline for the open-practice track.** Not a copy of
Duolingo's proprietary course content — that's a real legal exposure to
avoid, not a shortcut to take. Instead: CEFR-tagged vocabulary and
grammar from open references like the Cambridge English Vocabulary
Profile and the New General Service List, real example sentences from
the open Tatoeba corpus, generated listening audio via text-to-speech
rather than sourced recordings, and LLM-generated exercise items against
that open data — a defensible, scalable content strategy rather than a
content team the company doesn't have yet.

**A teacher materials library, exam builder and lesson-plan builder** —
manual and teacher-controlled by design, not AI-authored. Vietnam
standardized its national English curriculum as of 2026, which means the
content a teacher needs is largely known in advance; the product's job is
making it fast to assemble and assign, not generating it unsupervised.
AI assistance is a deliberate phase two, layered on top of a manual
system teachers already trust, not the starting point.

**Parent tier.** No parent app exists yet, but the backend already
anticipates it — the Level Engine has functions purpose-built to answer
"why is my child at this level" (a per-input contribution breakdown and a
weakest-input detector), and score history is already stored. The
monetization split: a free trust layer (current level, streak, the
teacher's actual written comments) that costs nothing and builds
confidence in the number, and a paid insight layer (a skill breakdown
radar, time-spent and consistency patterns, score trends, a
plain-language weekly summary) that is the actual analytics product.
This is a second, genuinely distinct revenue surface from the core
school relationship, not a repackaging of the same subscription.

---

## Why this is defensible, not just well-built

**The number is real, and that's rare.** Most "AI level" or "AI score"
claims in ed-tech are a black box or a vanity metric. Beeblast's CEFR
composite is an open, explainable formula over auditable inputs — a
school or a parent can be shown exactly why a student is B1 and not B2,
because the system can already compute that answer today.

**One data model, three trust relationships.** A school buys the product
because of curriculum fidelity and teacher tooling. A student stays
because of the game loop. A parent pays, eventually, because of the
insight layer. Three different value propositions to three different
people who all need to trust the same underlying number — and because
it's one system rather than three, that trust compounds instead of
fragmenting.

**Built for the actual market.** Vietnam's 2026 curriculum
standardization is a tailwind, not a constraint being worked around — it
means the content strategy (a known, finite curriculum to digitize once)
and the credibility pitch (a real CEFR number, not an app-only score) are
aligned with what schools and the ministry already care about.

**Child-safety decisions made early, not retrofitted.** The avatar
library is explicitly curated to exclude inappropriate content. The
messaging design keeps peer interaction inside monitored, teacher-visible
threads rather than open direct messages between minors. These aren't
compliance checkboxes added under pressure later — they're already
architectural decisions in a system built for school-age users.

---

## Honest open questions

An investor's diligence will find these regardless, so stated plainly:

- **Multi-class support isn't real yet.** The data model currently
  assumes one class per teacher. If a teacher realistically manages
  several classes, that's a genuine schema change, not a UI tweak, and
  it blocks the cross-class comparison view on the roadmap.
- **Writing and speaking assessment need a grading path.** Objective
  items (multiple choice, fill-in-blank) grade themselves. Open-response
  writing and speaking currently route to manual teacher grading — a real
  and reasonable v1, but AI-assisted or automated scoring for those two
  skills is unsolved, not just unbuilt.
- **The open-practice content pipeline is a plan, not inventory yet.**
  The sourcing strategy is sound and legally clean, but the actual volume
  of CEFR-tagged, skill-tagged content at launch is a real execution
  question, separate from whether the architecture supports it.
- **The parent app doesn't exist yet.** The backend is ready for it; the
  screens are not. It's the newest, least-derisked part of the three-app
  system.

---

## The pitch, compressed

Most companies in this space are selling either engagement or rigor.
Beeblast is built so the same number is both — a real CEFR score that a
school trusts because it's auditable, that a student chases because it's
gamified, and that a parent will eventually pay to understand in more
depth than a single letter grade. That's the product. Everything else in
this document is either already running or is a specific, scoped step
toward it.
