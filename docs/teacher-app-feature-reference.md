# Beeblast Teacher App — Feature & Button Reference

Every screen, button, and action currently available to a teacher in Beeblast, described in detail: what it shows, what each control does, and what happens on the backend when it's used. This is a snapshot of the real, wired product (not a mockup) — every action listed here writes to Supabase and, where noted, immediately affects what students and parents see.

---

## Navigation shell

The teacher app uses a persistent sidebar grouped into six sections, plus a header bar showing the teacher's name, their class name/schedule, and a live-data indicator (pulses when new data arrives via realtime).

- **Overview** — Dashboard
- **Học liệu (Materials)** — Materials Library
- **Giảng dạy (Teaching)** — Roster, Curriculum, Lesson Plans
- **Đánh giá (Assessment)** — Exam Builder, Gradebook, Assignment History
- **Hoạt động (Activity)** — Class Story
- **Hệ thống (System)** — Account, Help

---

## 1. Overview (Dashboard)

The landing page. Three tabs:

**Tab "Theo lớp" (By class)**
- Three stat cards: class average composite score (0–100), number of students needing attention, class headcount.
- "Tuỳ chỉnh" (Customize) button opens a popover where the teacher can change the numeric threshold that defines "needs attention" (default: composite score below 40). Changing it live-recalculates who shows up in the at-risk list below — this is client-side filtering, no save/persist action.
- "Xem toàn bộ danh sách" (View full list) link jumps to the Roster page.
- CEFR distribution chart: a dropdown switches between bar chart and line chart, both rendering how many students fall into each CEFR band (A1–C2).
- "Danh sách học sinh cần nhắc nhở" (Students needing a nudge): a list of at-risk students (below the threshold, or who haven't practiced today) with a "Nhắc nhở →" (Remind) link that goes to that student's detail page — this is a link, not a direct in-place action.

**Tab "So sánh các lớp" (Compare classes)**
- Currently shows a placeholder: "You are currently teaching 1 class. Once you have more classes, a comparison chart will appear here." Not functional yet because a teacher account currently maps to exactly one class.

**Tab "Theo thời gian" (Over time)**
- An area chart of the class's average composite score over time, one point per date a batch of scores was computed. This is the one true trend line — it comes from real `level_scores` history, not a fake demo curve, though a synthetic four-week placeholder is shown if no history exists yet.

---

## 2. Roster (Lớp học)

Shows the full class list. Three stat cards up top (class average, number needing attention, weakest shared skill across the class — e.g., "vocabulary" if that's the lowest-scoring input on average), then a table of every student:

- **Học sinh column**: avatar + name (click → student detail page) + a streak pill (days in a row practicing, with state: active today / at risk / broken).
- **Trình độ column**: a level bar (visual breakdown of the five CEFR inputs) or "no data yet" if the student hasn't been scored.
- **Trạng thái column**: a status badge — "Ổn định" (stable, green), "Cần chú ý" (needs attention, amber), or "Cần hỗ trợ" (needs support, red) — computed from score and streak.
- **Hành động column**:
  - **"Tuyên dương" (Kudos)** button opens a dialog: pick a tag (Hard work / Teamwork / Persistence / On task / Custom), optionally add a short note, then "Gửi tuyên dương." This writes a `kudos` row and **notifies the student and their parent immediately** — it's designed as a fast, daily habit-building action, separate from grading.
  - **"Chi tiết →" (Details)** link goes to the student's full profile page.

At the top of the page, a **"Kiểm tra streak hôm nay" (Check streaks today)** button runs the same streak-check job that normally fires on a schedule (a cron endpoint). It reports how many students are at risk of losing their streak and how many already lost it, and sends the corresponding warning notifications. The button exists purely so this doesn't have to wait for a real day to roll over during testing/demos — it's the same real logic, not a fake result.

---

## 3. Curriculum (Chương trình)

### 3a. Unit list

Lists every "Unit" (topic) created for the class, each showing a badge: "Đã giao" (assigned, green) or "Chưa giao" (not assigned, gray), plus a one-line summary of how much content it has (vocab count · grammar points · exercises).

- **"Soạn nội dung" (Build content)** — opens the unit's builder page (3b below).
- **"Giao cho lớp" (Assign to class)** — only shown on unassigned units, disabled until the unit has at least one exercise. Assigning: sets `assigned_at`, immediately unlocks that unit inside every student's practice path in the app, **notifies students and parents**, and recomputes every student's CEFR score (the "curriculum coverage" input's denominator just changed).
- **"Thu hồi" (Withdraw)** — same button, relabeled once a unit is assigned. Un-assigns it: hides the unit from students again. Same component, two states, not two separate features.
- **"Thêm bài học mới" (Add new lesson)** — a text field + "Tạo bài học" (Create lesson) button. Creates an empty unit and immediately routes the teacher into that unit's builder, since an empty unit isn't useful yet.

### 3b. Unit builder (Soạn nội dung)

Reached via "Soạn nội dung." Shows a back link to the unit list, the unit title, and an assign/withdraw + create-exam action pair (same `AssignTopicButton` as above, plus a "Tạo đề" button described in Exam Builder below). Three editable blocks:

- **Từ vựng (Vocabulary)** — a list of existing terms (English term, Vietnamese meaning, optional example sentence) each with a two-step "Xoá" (Delete — click once to arm, click again within 3 seconds to confirm, no modal) button, and a form to add a new term.
- **Điểm ngữ pháp (Grammar points)** — a list of named grammar points with a short explanation, add form, same two-step delete.
- **Bài tập luyện (Practice exercises)** — a manual exercise builder with three types selectable via toggle buttons: Trắc nghiệm (multiple choice, with a radio button marking the correct option), Điền từ (fill-in-the-blank, sentence + answer + optional hint), Nối từ (matching pairs, with a "+ Thêm cặp" button to add more pairs). Each exercise can optionally be tagged to one of the unit's grammar points — doing so means a correct answer raises that specific grammar point's mastery score for the student, not just the general exercise count. Existing exercises are listed above the form with a live preview of prompt + correct answer, and the same two-step delete.

This is explicitly a manual builder — no AI generation involved, by design, so behavior is deterministic and every question is something the teacher actually wrote.

---

## 4. Lesson Plans (Giáo án)

A two-column layout: saved plans on the left, the selected plan's printable preview on the right.

- **"Soạn giáo án mới" (Write new lesson plan)** button opens a dialog form matching the official Ministry of Education lesson-plan template: title, optional linked unit (dropdown), and four required text blocks — I. Objectives, II. Materials, III. Teaching procedure (warm-up / presentation / practice / production), IV. Homework. Saving creates the plan and it appears in the left list.
- Clicking a saved plan in the left list shows it formatted as a standard printable lesson-plan document (centered header with subject/class/teacher, then the four numbered sections).
- **"In giáo án (PDF)" (Print lesson plan)** triggers the browser's print dialog (`window.print()`), styled to produce a clean printout — this is the artifact a teacher hands to a school's academic affairs office or keeps on file, since Vietnamese schools generally expect a written lesson plan in this exact format regardless of what software is used.

This whole feature is intentionally disconnected from the interactive Curriculum content: a lesson plan can reference a unit by name for context, but it's a paperwork/compliance document, not something a student ever sees in the app.

---

## 5. Materials Library (Thư viện học liệu)

A file library for supplementary teaching materials (PDF / audio / Word docs) — not interactive content, just organized storage.

- **"Tạo thư mục" (New folder)** dialog: name a folder to organize materials into.
- **"Tải lên tài liệu" (Upload material)** dialog: title, file type (PDF / Audio / Doc), optional linked unit, and a CEFR level tag.
- Folder grid: click any folder card (or "Tất cả tài liệu" / All materials) to filter the list below to that folder. The active folder is highlighted.
- Search box filters by title; a CEFR dropdown filters by level.
- Each material row shows a CEFR badge, file type, and a download icon button.

---

## 6. Exam Builder (Soạn đề thi)

Two ways to reach exam creation:

- **From a unit** ("Tạo đề" / "Create exam" button on the unit builder page): builds an exam directly from that unit's gradable questions (multiple choice + fill-in-the-blank only — matching exercises aren't auto-gradable) and publishes it immediately. Disabled if the unit has zero gradable questions.
- **From the dedicated Soạn đề page**: a manual question-bank picker. Enter an exam title, optionally filter the question bank by unit, then click individual question cards to select/deselect them (checkbox + highlighted border). A running counter shows how many are selected. **"Lưu đề thi" (Save exam)** is disabled until there's a title and at least one question selected.

---

## 7. Gradebook (Chấm bài)

Lists every exam for the class as a card, each showing question count, how many students have submitted, and published/unpublished status. Inside each exam card, every submission is a row with:

- **Auto-score button** ("Tự chấm" / "Chấm lại") — only shown if the exam has auto-gradable questions. Scores the student's stored answers against the correct answers automatically.
- **Manual score field** — a number input (0–100) + "Lưu điểm" (Save score) button, for exams or questions that need human judgment.

Either path writes the score, raises the relevant grammar-mastery values, and **recomputes the student's CEFR level on the spot** — this is what makes the student's and parent's progress views update live right after grading, not on some batch delay. A list of students who haven't submitted yet is shown under each exam.

---

## 8. Assignment History (Lịch sử giao bài)

A read-only timeline combining two event types in one feed: every time a unit was assigned to the class, and every time an exam was published. Each entry shows an icon (book for units, checkmark for exams), a badge, and a timestamp. Purely for the teacher's own record-keeping — no actions to take here beyond scrolling.

---

## 9. Class Story (Bảng tin)

Three blocks on one page:

- **"Đăng thông báo cho lớp" (Post an announcement)** — a text box + "Đăng thông báo" button. Posts are visible to students and parents immediately.
- **Student journal entries** — short reflections students write after finishing a lesson. Each one has a **"Viết nhận xét" (Write a comment)** button that opens an inline textarea; once submitted, the comment is shown back with a "Sửa nhận xét" (Edit) link to revise it later. Parents can also see these comments.
- **Recent kudos feed** — a read-only log of the most recent "Tuyên dương" actions sent from the Roster page, so the teacher can see their own recent recognition activity in one place.

---

## 10. Account (Tài khoản)

Read-only profile card: name, role, and assigned class. No editable settings currently (no notification toggles, no password change) — this page is a placeholder identity display, not a settings panel yet.

---

## 11. Help (Trợ giúp)

Two static info cards: "Hướng dẫn giảng dạy" (how assigning lessons/exams affects CEFR tracking) and "Hỗ trợ kỹ thuật" (support email/hotline). No interactive elements.

---

## Cross-cutting notes

- **Every write action shows a toast** (success or error) — there's no silent failure anywhere in the teacher app.
- **Notifications fire automatically** on: kudos, unit assignment, exam grading (implicitly, since level recomputes), streak warnings, class posts, and journal comments — the teacher never has to remember to "tell" a parent something happened.
- **CEFR score recomputation is triggered by three teacher actions specifically**: assigning/withdrawing a unit (changes coverage), grading a submission (changes exam score + grammar mastery), and nothing else — vocabulary/grammar-point edits alone don't move the score until a student actually practices against them.
- **No AI-driven automation anywhere in this app** — every piece of content (vocab, grammar, exercises, exams, lesson plans) is manually authored by the teacher. This was a deliberate product decision to keep the teacher in full control rather than have anything auto-generated.
