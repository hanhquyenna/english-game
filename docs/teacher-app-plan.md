# Teacher app — dev plan

Revision 2. Supersedes the visual direction in the first version of this
doc (that version said "keep teacher plain shadcn, green accent, no new
component system" — the shadcn/plain-component part still stands, the
color and layout direction below replaces it). Feature breakdown from the
first pass (materials library, exam builder, lesson plans, etc.) is kept
as-is further down; §1 to §4 here are new and take priority.

---

## 1. Visual direction

**Color: match the student app.** Drop the green (`#0f6e56`) teacher
accent. Use the same terracotta (`--st-primary`, `#c75b39`) as the primary
color for teacher too. One brand color across the whole product now —
what tells teacher and student apart is layout density and component
shape (plain shadcn cards and buttons for teacher vs. the retro
hard-shadow tiles for student), not a different hue. This directly
answers "make all the features matching with the student app": same
color language, deliberately different shape language, on purpose, not by
accident.

**Header: drop the wordmark.** The current header spends its left side on
"BEEBLAST" as static text next to the teacher's name — remove it. Header
becomes just the teacher's name, the class name, and the live indicator.
Matches the restraint in the reference screenshot, which doesn't brand
every screen either.

**Every element has to actually be a shadcn primitive.** This is most of
why the current Bảng tin (feed) screen reads as misaligned: the green
"Đăng thông báo" button and some card internals are hand-styled rather
than drawn from `Button`/`Card`, so they don't share the same radius,
shadow, or padding rhythm as the rest of the page. Fix is mechanical once
flagged: replace any one-off styled `<button>`/`<div>` with the actual
`Button`/`Card` components already in `src/components/ui`, everywhere in
the teacher app, not just on the feed page.

**Sidebar needs the real shadcn Sidebar component.** Today's nav
(`PersonaShell`) is a flat `<ul>` of links — no grouping, which is the
biggest structural difference from the reference screenshot's HỌC LIỆU /
THƯ VIỆN / GIẢNG DẠY / HỆ THỐNG sections. `src/components/ui` doesn't have
a `sidebar.tsx` yet (checked — only avatar/badge/button/card/dialog/
input/label/progress/select/separator/sonner/table/tabs/textarea exist).
Pulling in shadcn's actual Sidebar component (`SidebarGroup`,
`SidebarGroupLabel`, `SidebarMenu`) gets grouped sections, collapsible
groups, and consistent active-state styling for free, instead of
hand-rolling something that approximates it.

---

## 2. Sidebar groups

Reusing the grouping from the first pass, now explicitly tied to the real
Sidebar component:

- **Tổng quan** — Dashboard (§3, new landing page)
- **Học liệu** — Materials library (new, see feature section below)
- **Giảng dạy** — Lớp học, Học sinh, Chương trình, Giáo án
- **Đánh giá** — Soạn đề, Chấm bài, Lịch sử giao bài
- **Hoạt động** — Bảng tin
- **Hệ thống** — Tài khoản, Trợ giúp

---

## 3. Dashboard as the landing page

Right now a teacher lands on the roster ("Lớp học"). Change the landing
route to a dashboard with a view switcher (shadcn `Tabs`):

- **Theo lớp** (class view, default) — this class's CEFR band
  distribution, streak health, recent activity. Mostly assembled from
  data that already exists (`level_scores`, `xp_events`).
- **So sánh giữa các lớp** (compare across classes) — depends on whether
  a teacher can actually have more than one class. Today's queries
  (`getClassForTeacher`) assume exactly one. Flag this and confirm before
  building the tab — no point designing a comparison view for data that
  can't exist yet.
- **Theo thời gian** (timeline) — composite score trend over weeks.
  `level_scores.computed_at` already makes every recompute a historical
  row, so this is a query plus a chart, not new tracking.

`recharts` is already a project dependency — no new library needed for
the charts.

---

## 4. Copy cleanup

- Emoji: done in the previous pass (nav icons, buttons, notification
  labels, streak pill — all converted to lucide icons).
- Em dashes: still present in several places, all user-facing or
  console-adjacent text, worth a real sweep:
  - `teacher/[teacherId]/page.tsx` — "Trung bình X/100 —" and a bare "—"
    used as an empty-state placeholder
  - `vocab-editor.tsx` — "— {nghĩa từ}" between term and meaning
  - `exercise-editor.tsx` — "— Không gắn —" option label, "—" fallback
    display
  - `streak-check-button.tsx` — toast: "Đã kiểm tra — không có streak..."
  - `assign-topic-button.tsx` — "Bài học chưa có bài tập nào — thêm nội
    dung trước khi giao"
  - `grade-row.tsx` — toast message with an em dash
  Replace with periods, colons, or a plain hyphen depending on context;
  empty-state placeholders can just be a plain "–" or "Chưa có dữ liệu"
  instead of an em dash doing double duty as punctuation.
- Stays in Vietnamese throughout — no language change, just punctuation
  and iconography.

---

## Feature plan (from the first pass — still valid)

### What your flow sketch had, and what happens to each piece

| Flow step | Status | Decision |
|---|---|---|
| Manage class and student roster | exists | keep, extend student profile view |
| Uploaded materials library | missing | new, §5 below |
| AI reads materials, auto-tags topic and level | in sketch | removed, teacher tags manually on upload |
| AI composes exam from materials | in sketch | removed, manual exam builder, §7 |
| Assign exam to class or student | exists | extend to per-student assignment |
| Assign homework by topic or goal | exists | add an optional goal or target field |
| Grade exams: auto MCQ, AI-assisted essay | exists | keep auto-grade for objective items, essay stays manual in v1 |
| Publish exam results | exists | confirm a UI toggle exists, add one if missing |
| History of each exam or homework assignment | missing | new, §8 |
| AI drafts lesson plan | in sketch | removed, manual builder, §9 |
| Lesson plan exported to standard format | missing | new, §9 |
| Dashboard: class level, compare across classes | partially exists | new, §3 above |

### 5. Materials library

Folder-based library, adopted from the reference screenshot's structure:
folder-card grid, search and filter, upload flow where the teacher tags
topic and CEFR level themselves. Needs a `materials` table and a
`material_folders` table — nothing today models a generic uploaded
library, only structured vocab/grammar/exercise rows tied to a topic.

### 6. Class and student management

Add to the existing student detail route: a per-word and per-grammar-point
coverage grid — `vocab_mastery` and `grammar_mastery` already store this
per student, only the screen is missing.

### 7. Exam builder

New screen: pick a topic, see its question bank, check the items wanted,
save as an `exams` row. `exercise_ids` already takes an arbitrary array,
so this is a picker UI over existing data. Should support mixing skills
(vocab, grammar, reading, listening, writing, speaking) into one exam.

### 8. Assignment history

A reverse-chronological log of assignment and publish events. First
version can be a query over existing timestamps
(`topics.assigned_at`, `exams.published_at`) rather than a new event
table.

### 9. Lesson plans

Manual builder: pick materials from the library, arrange into a template
(objectives, materials, activities, homework). New `lesson_plans` table.
Export to the standard printed format Vietnamese schools use for records
is a template-fill problem, not an AI problem.

---

## Build order

1. Visual direction (§1) and sidebar groups (§2) — touches every screen,
   do it first so nothing gets built twice.
2. Copy cleanup (§4) — cheap, do alongside §1.
3. Dashboard (§3) — the new landing page.
4. Materials library (§5) — unblocks the exam builder and lesson plans.
5. Exam builder (§7), student detail additions (§6) — can run in
   parallel once §5 exists.
6. Assignment history (§8) — cheap once §5/§7 exist to log.
7. Lesson plans and export (§9) — depends on §5.
