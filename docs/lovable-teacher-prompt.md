# Lovable prompt — Beeblast teacher app

Paste everything below into Lovable as one prompt. It is scoped to the
teacher-facing app only. The student app already exists in a separate,
deliberately different visual style (playful, illustrated, cream and
terracotta with hard-edged retro cards) — do not touch or reproduce that
style here. The teacher app shares only the brand color with it, nothing
else.

---

## Product context

Beeblast is an English-learning platform for a Vietnamese school. Three
people use it: a teacher who runs a class, a student who practices daily
in a separate gamified mobile app, and a parent who watches their child's
progress. This prompt is for the teacher's side only: a clean, fast,
data-dense web dashboard a teacher uses on a laptop between classes, not
a marketing site and not a game.

The whole product hangs on one real number: a student's CEFR level
(A1 through C2, the same scale Cambridge and IELTS use), computed from
real study hours, vocabulary mastery, exam scores, curriculum coverage,
and grammar mastery. Every screen you build should treat that number as
the most trustworthy thing on the page, not a decorative badge.

## Vibe

Clean, quiet, professional. A teacher opens this between classes and
needs to find something in five seconds, not admire it. Think a
well-built internal analytics tool or a modern school admin panel, not a
consumer app. Generous whitespace, restrained color, one accent color
used sparingly for actions and emphasis, everything else neutral gray and
white. Nothing should feel playful or gamified here, that register
belongs entirely to the separate student app.

## Hard rules

- No emoji anywhere, in any copy, label, or icon. Use a proper icon
  library (Lucide) for every icon.
- No em dashes in any Vietnamese copy. Use a period, a comma, or a colon
  instead.
- All UI copy is in Vietnamese. Keep it plain and direct, not
  translated-sounding.
- Use shadcn/ui components throughout (Card, Button, Tabs, Table, Badge,
  Dialog, Select, Sidebar, Chart). Do not hand-roll a custom button or
  card style anywhere, every interactive element and every container
  should visibly be the same shadcn primitive as every other one on the
  page. This consistency is the single most important thing about the
  redesign, the previous version failed specifically because some
  elements were custom-styled and broke the shared rhythm.
- Every student referenced anywhere (roster, reminders, gradebook,
  leaderboard-style lists) uses the same avatar treatment consistently:
  a circular illustrated character avatar, never a generic photo, stock
  icon, or a different style per screen.
- No placeholder cards that describe a chart in text instead of rendering
  one. If a card says it shows a distribution, it must contain an actual
  chart.
- Design for real empty and loading states, not just the happy path: a
  class with zero students, a chart with no data yet, a list with
  nothing to show. Empty states get a short plain sentence, never an
  emoji or a cute illustration.

## Design system

**Color.** One brand accent: `#c75b39` (a warm terracotta/rust), used for
primary buttons, active nav states, links, and chart emphasis. Neutral
base: white background, very light gray (`#f7f7f6`-ish) page background
behind white cards, dark neutral gray for body text (not pure black).
Semantic colors used sparingly and only for status: a muted green for
positive or "on track" states, a muted amber for "needs attention", a
muted red for "at risk" or destructive actions. Do not introduce any
other hue.

**Typography.** A single clean neutral sans-serif (Inter or equivalent)
for everything, no serif or display font anywhere, that register belongs
to the student app only. Clear hierarchy: page titles large and bold,
section labels small and medium-weight, body text comfortable and
readable, numbers in stat cards large and bold so they scan instantly.

**Shape.** Cards: white background, subtle 1px neutral border, small
consistent border radius (around 8-10px), a barely-there shadow, never a
hard offset drop shadow. Buttons: shadcn defaults, primary filled in the
brand color, secondary outlined, consistent height and padding across
every screen. Consistent 24px gap between cards, consistent internal card
padding.

**Icons.** Lucide only. Muted neutral gray for decorative/status icons on
cards, brand color only when an icon indicates an active or primary
state.

## Information architecture

Sidebar, grouped, collapsible groups, using shadcn's Sidebar component:

- **Tổng quan** — Tổng quan (dashboard, the landing page)
- **Học liệu** — Thư viện học liệu
- **Giảng dạy** — Lớp học, Chương trình, Giáo án
- **Đánh giá** — Soạn đề, Chấm bài, Lịch sử giao bài
- **Hoạt động** — Bảng tin
- **Hệ thống** — Tài khoản, Trợ giúp

Header above the content area: teacher's name and their class name and
schedule (for example "Cô Linh — B1, Sáng Thứ 7", but without an actual
em dash, use a middle dot or comma instead), plus a small live indicator
badge on the right when real-time data is connected. No app wordmark or
logo text in the header, keep it to the teacher's own context only.

## Screens

### 1. Tổng quan (Dashboard) — the landing page

Page header: title "Tổng quan lớp học", one line of context underneath
(class name, short description), a "Xem toàn bộ danh sách" link on the
right pointing to the roster.

A three-tab view switcher directly under the header (shadcn Tabs, segment
style, not underline style): "Theo lớp" (default), "So sánh các lớp",
"Theo thời gian".

**Theo lớp tab:**
- A row of three stat cards: average score out of 100, number of students
  needing attention (with the rule shown underneath, e.g. "chưa luyện tập
  hôm nay hoặc điểm dưới 40"), and class size. Each card: a muted icon top
  right, a large bold number, a short description line underneath. Same
  card style for all three, same icon treatment, same spacing.
- A CEFR distribution card that actually renders a bar chart (shadcn
  Chart component, built on Recharts): six bars, one per band A1 through
  C2, height representing number of students in that band, brand color
  bars. Include a small dropdown in the card's top-right corner to switch
  what the chart shows (for example "Phân bố trình độ", "Phân bố streak",
  "Phân bố điểm thi"), and a small settings icon button next to it that
  opens a popover letting the teacher choose which cards appear on this
  tab at all.
- A "students needing a nudge" list: each row has the student's avatar,
  name, a small status pill (amber for "at risk", red for "broken",
  showing the number of days), and a "Nhắc nhở" action on the right with
  a chevron icon, not a bare arrow character.

**So sánh các lớp tab:** a comparison view across the teacher's classes
(bar or grouped-bar chart comparing average score and CEFR distribution
per class), plus a simple table underneath listing each class with its
key numbers. If there is currently only one class in the data, design
this tab to still look complete and intentional with one class shown,
not broken.

**Theo thời gian tab:** a line chart showing the class's average
composite score over time (weekly points), with a date-range dropdown
(for example "4 tuần qua", "Học kỳ này", "Từ đầu năm").

### 2. Thư viện học liệu (Materials library)

A folder-card grid: each folder shows a name, an item count, and a
visibility badge ("Nội bộ" or "Công khai"). A search bar and a filter
button in the top right, plus a "Tạo thư mục" primary button. Two tabs
above the grid: "Học liệu của trường" and "Đã xoá gần đây". Clicking a
folder drills into its contents, a list of individual materials
(documents, question sets, vocab lists) each with a type icon, a title,
and a menu for actions.

### 3. Lớp học (Roster)

A table or clean row list of students: avatar, name, current CEFR band
as a small badge, current streak, last active time, and quick actions
(message, give kudos) on the right. Clicking a student opens their detail
view: their level breakdown across the five inputs, per-word and
per-grammar mastery shown as a filterable grid or tag list (mastered
words in one tone, in-progress in another), recent activity, and any
kudos or journal comments exchanged with them.

### 4. Chương trình (Curriculum)

A list of units, each showing its title, CEFR level, assignment status,
and a small progress indicator. Opening a unit shows its lessons as a
simple ordered list: six lesson slots plus one exam slot at the end.

This is the important new piece: clicking into a single lesson opens an
editor with three tabs, not a flat form:
- **Học liệu** — the reading, vocabulary, or reference material for this
  specific lesson.
- **Câu hỏi luyện tập** — the quiz and exercise items for this lesson,
  each tagged by skill (vocabulary, grammar, reading, listening, writing,
  speaking) shown as a small colored badge.
- **Bài tập về nhà** — optional homework attached to this lesson
  specifically, separate from the practice quiz.

Whatever the teacher edits here is exactly what the student sees when
they open this lesson on their own path, there is no separate publish
step, editing this is editing the live lesson.

### 5. Giáo án (Lesson plans)

A list of lesson plans per unit. Creating one lets the teacher pull
materials from the library into a structured template: objectives,
materials used, in-class activities, homework assigned. A prominent
"Xuất giáo án" button exports the plan into a standard printable format.

### 6. Soạn đề (Exam builder)

Pick a unit from a dropdown, see its full question bank as a checklist
(each item showing its skill badge and a short preview), select the ones
to include, set point values inline, then save and assign to the class or
to individual students via a multi-select.

### 7. Chấm bài (Gradebook)

A table: rows are students, columns are exams, cells show scores or a
"chưa chấm" pending state. A publish toggle per exam clearly visible at
the top of its column, with a confirmation step before publishing results
to students and parents.

### 8. Lịch sử giao bài (Assignment history)

A reverse-chronological timeline: each entry shows what was assigned or
published, to whom, and when, with a filter by type (bài tập, đề thi).

### 9. Bảng tin (Class feed)

A single clean column, consistent card style throughout for every item
type. A post composer card at the top (textarea plus a single primary
"Đăng thông báo" button, actual shadcn Button, not a custom-colored pill).
Below it, a feed mixing teacher announcements and student journal entries
with the teacher's written feedback attached inline, each in the same
card treatment, ordered by recency, with a comment thread under each
class-wide post.

### 10. Tài khoản / Trợ giúp

Simple, minimal settings screens: profile info and preferences on one,
a short FAQ or contact block on the other. Nothing elaborate needed here.

## User flows

Build these as real, complete sequences, not just the screens they pass
through. Every flow that changes data ends with a toast confirmation
(shadcn Sonner style toast, no emoji in the message) and, where the
change is visible elsewhere in the app, that other place should update
without a page reload.

### Morning check-in

Teacher opens the app and lands on Tổng quan. They scan the three stat
cards, then their eye goes to "Học sinh cần chú ý". They click into the
reminder list at the bottom of the tab. Each row's "Nhắc nhở" opens a
small dialog: the student's name, their current streak or last-active
state, a pre-filled short message the teacher can edit, and a "Gửi nhắc
nhở" button. Sending it closes the dialog, shows a confirmation toast, and
that student's row gets a small "đã nhắc" (reminded) marker so the
teacher doesn't send the same nudge twice in one day.

### Building and editing a lesson (the core new flow)

Chương trình shows the unit list. Teacher clicks a unit, sees its six
lessons plus the exam slot as an ordered list, each row showing whether
it already has materials and a quiz attached or is still empty. Clicking
an empty lesson opens the three-tab editor (Học liệu, Câu hỏi luyện tập,
Bài tập về nhà) with all three tabs empty and a short prompt in each
telling the teacher what belongs there. Clicking a lesson that already
has content opens the same editor pre-filled, ready to adjust.

Inside the editor: the Học liệu tab lets the teacher either write content
directly or pull an existing item in from Thư viện học liệu via a picker
button. The Câu hỏi luyện tập tab shows the current quiz items as a
reorderable list with an "Thêm câu hỏi" button that opens a picker over
the question bank, each item tagged with its skill badge. The Bài tập về
nhà tab is optional and starts collapsed with a plain "Thêm bài tập về
nhà" button if the teacher wants to attach one.

There is no separate publish step. Saving in this editor (an explicit
"Lưu thay đổi" button, not silent autosave, so the teacher knows the edit
went through) writes directly to the lesson. The prompt should describe
this to the teacher in the editor itself with one small line of helper
text: content here is what the student sees immediately when they open
this lesson.

### Assigning a unit

From the unit list in Chương trình, an unassigned unit shows a "Giao cho
lớp" button. Clicking it opens a confirmation dialog summarizing what's
being assigned (unit title, number of lessons with content ready, a
warning if any lesson is still empty) and a primary confirm button. After
confirming, the unit's status badge changes to "Đã giao" and a toast
confirms it, students and parents are notified (this can be described in
the confirmation copy even though the notification itself happens
elsewhere).

### Building, assigning, and publishing an exam

Soạn đề: teacher picks a unit from a dropdown, the question bank for that
unit loads as a checklist grouped by skill. Teacher checks the items
wanted, sets point values in an inline field next to each, and a running
total point count is shown at the bottom. Clicking "Tạo đề" opens an
assign step: whole class or a multi-select of specific students, plus a
title field pre-filled from the unit name. Confirming creates the exam
and routes the teacher to Chấm bài with that exam's column already
selected.

In Chấm bài, objective items (multiple choice, fill-in-blank) show scores
automatically as students submit. Writing and speaking items show
"chưa chấm" until the teacher opens that submission and enters a score
and short feedback. Once the teacher is satisfied, a "Công bố kết quả"
button at the top of that exam's column opens a confirmation dialog
warning this immediately notifies students and their parents. Confirming
flips the exam to published and the button becomes a disabled "Đã công
bố" state.

### Posting to the class feed and giving kudos

Bảng tin: teacher writes in the composer textarea, clicks "Đăng thông
báo", the post appears at the top of the feed below immediately, no
reload. From a student's row anywhere in the app (roster, dashboard
reminder list, student detail page), a "Tuyên dương" button opens the
kudos dialog: a set of tag chips (Chăm chỉ, Hợp tác, Kiên trì, Tập trung,
Khác) and an optional short note, confirm sends it, the student and their
parents are notified, and it appears as an entry in that student's
activity history.

### Switching dashboard views

Tổng quan's three tabs (Theo lớp, So sánh các lớp, Theo thời gian) keep
their own state when switched between, so flipping back to a previous tab
doesn't lose a chosen date range or chart selection. Inside Theo lớp, the
chart dropdown swaps the CEFR distribution chart for a different metric
in place, same card, same position, just the chart contents change. The
settings popover next to it lets the teacher toggle individual cards on
or off for that tab, remembered for their next visit.

## States to design explicitly

- Loading: skeleton placeholders matching each card and table's actual
  shape, not a generic spinner.
- Empty: a short plain Vietnamese sentence explaining what will appear
  there and why it's empty right now (for example, a class with no
  students yet, a chart with no scores yet).
- Error: a toast notification, never a raw error dump on the page.

## What "done" looks like

A teacher should be able to look at any two screens in this app and not
be able to tell they were built at different times. Every card, button,
badge, and icon should look like it came from the same small set of
primitives, reused everywhere, with only content changing between
screens.
