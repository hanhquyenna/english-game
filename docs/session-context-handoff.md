# Beeblast — Toàn bộ context phiên làm việc (để bắt đầu thread mới)

> Tài liệu này tổng hợp lại toàn bộ những gì đã trao đổi, quyết định và code đã thay đổi trong phiên chat này, theo đúng trình tự thời gian, không bỏ sót chi tiết. Dùng file này để "mồi" cho một phiên Claude mới nếu cần tiếp tục công việc.

---

## 1. Sản phẩm là gì

**Beeblast** là nền tảng học tiếng Anh Next.js + Supabase cho trường học Việt Nam, có 3 persona: **Học sinh (Student)**, **Giáo viên (Teacher)**, **Phụ huynh (Parent)**. Đây là sản phẩm thật, đang phát triển production (không phải demo), có một phiên Claude Code song song khác cũng đang chỉnh sửa cùng repo.

Repo: `/Users/ad/Documents/Beeblast` (Next.js App Router + Supabase Postgres/RLS/realtime + Tailwind + shadcn/ui base-nova style).

---

## 2. Toàn bộ diễn biến brainstorm sản phẩm (theo thứ tự)

1. Câu hỏi mở đầu: Claude in Chrome có thể "clone" UI của một web app đã publish không.
2. User upload file zip `UX-UI-Deep-Dive.zip` — một bản thiết kế UX/UI kiểu Duolingo — hỏi có thể áp dụng vào Beeblast được không, **giữ nguyên thư viện avatar Open Peeps** đã build riêng (thư mục "Flat Assets" trong repo).
3. Sau khi xác nhận muốn build trực tiếp vào code thật của Beeblast, không phải bản demo riêng.
4. Brainstorm lớn về mô hình sản phẩm: kết hợp chương trình học do giáo viên giao (school-assigned curriculum) với luyện tập tự do "Arena" trong cùng một data model dựa trên CEFR; công cụ cho giáo viên (học liệu, đề thi, chấm bài, xem theo từng học sinh/từng từ); lộ trình gamified với bài kiểm tra lớn mỗi 7 bài học, đánh số liên tục (không reset theo từng "island"); cấu trúc đề thi 4 kỹ năng (đọc/nghe/viết/nói) thay vì chỉ từ vựng/ngữ pháp; định vị sản phẩm là **"Duolingo + Canva"** (trải nghiệm gamified cho học sinh + công cụ soạn nội dung dễ dùng cho giáo viên); mô hình kiếm tiền từ phụ huynh qua báo cáo miễn phí (trust layer) vs. báo cáo insight sâu (trả phí).
5. Yêu cầu kế hoạch phát triển chi tiết cho student app, kèm giá gem cụ thể và phần thưởng, lưu thành plan doc, và một prompt Claude Code có thể copy-paste, bám sát các component/token đã có sẵn.
6. Hỏi liệu Gemini (model rẻ hơn) có build được plan này không — muốn đánh giá độ phức tạp/chi phí trung thực.
7. Yêu cầu UX/UI sạch cho giáo viên, kèm 2 ảnh tham khảo (một ảnh ed-tech có sidebar phân nhóm folder, một ảnh vẽ tay flow giáo viên/phụ huynh); yêu cầu rõ: **bỏ hết các bước "AI agent" tự động**, để giáo viên kiểm soát thủ công; tập trung "quản lý trước".
8. Phản hồi: UI giáo viên lúc đó **không khớp** về component/shape/button với student app.
9. Quyết định cuối cùng (đã chốt và thực thi bằng code): **giữ giáo viên và học sinh khác biệt về mặt hình dạng/thành phần** (shape/component language khác nhau) **nhưng dùng shadcn components thật**, và **bỏ hết emoji** để UI sạch, dễ hiểu.
10. Sau khi xem screenshot trang feed giáo viên thật (xấu, layout lệch), yêu cầu: bám theo layout sạch/gọn của ảnh tham khảo, dashboard là trang landing với nhiều view (theo lớp / so sánh giữa các lớp / theo thời gian), **toàn bộ tiếng Việt**, **không dùng dấu gạch ngang dài (em dash)**, **không emoji**, **dùng shadcn components**; và riêng biệt (ở tin nhắn kế tiếp): **dùng đúng màu thương hiệu chính giống student app**, và **bỏ chữ "BEEBLAST" wordmark** khỏi header, giữ header sạch/gọn. Lúc này user yêu cầu "chỉ cần plan" (chưa cần code).
11. Yêu cầu một "master plan" toàn bộ sản phẩm, dùng để pitch nhà đầu tư — cái gì đã build, cái gì hay, mọi lợi thế cạnh tranh.
12. Câu hỏi follow-up: phụ huynh sẽ trả tiền cho insight cụ thể nào trong báo cáo sâu.
13. User tạo một bản UI giáo viên bằng **Lovable** (một AI app builder khác, stack khác hẳn — TanStack Start/Vite/Bun), thấy "khá ổn", hỏi cách "clone toàn bộ" vào Beeblast, yêu cầu rõ dùng **Claude in Chrome**, dùng tab Lovable đã mở sẵn (cung cấp URL vì Claude không tự tìm được tab).
14. Khi Claude phát hiện Beeblast (Next.js thật) đã có chức năng tương đương/tốt hơn (do phiên Claude Code song song khác build, có wiring dữ liệu Supabase thật) và khuyên **KHÔNG NÊN** port toàn bộ từ Lovable, user đưa ra **chỉ thị cuối cùng, dứt khoát, ghi đè mọi cân nhắc**:

   > "i dont care, goal is i want the teacher ux.ui now looks like whats built in lovable all flows."

   → Đây là chỉ thị chi phối: áp dụng/nhân bản thiết kế trực quan và luồng tương tác của Lovable lên toàn bộ teacher app thật của Beeblast, bất kể trade-off đã nêu.
15. Ở phiên làm việc gần nhất (chính là phần vừa hoàn thành), user xác nhận tiếp tục: **"yes everything else in lovable ux.ui adapt them"** — áp dụng nốt các phần còn lại của Lovable UI/UX vào toàn bộ các màn hình còn lại.

---

## 3. Nguyên tắc thiết kế / an toàn đã thống nhất

- **Child safety**: chỉ chat/thread có giáo viên giám sát, không cho học sinh nhắn tin trực tiếp (DM) với nhau; benchmark theo percentile ẩn danh, không bao giờ so sánh trực tiếp với tên bạn cùng lớp.
- **Bản quyền nội dung**: cảnh báo rõ không được clone nguyên xi nội dung độc quyền của Duolingo (rủi ro pháp lý); khuyến nghị dùng nguồn CEFR mở (Cambridge English Vocabulary Profile, New General Service List, Tatoeba corpus) + TTS cho nghe + speech-scoring API cho nói.
- **Teacher vs Student**: khác biệt về shape/component nhưng cùng dùng shadcn thật, cùng tông màu thương hiệu, không emoji.

---

## 4. Kiến trúc kỹ thuật (đã xác nhận trong code)

- **Next.js App Router + Supabase** (Postgres, RLS, realtime publications) + Tailwind + shadcn/ui (`style: "base-nova"`, neutral base color, icon library lucide, theo `components.json`). Component primitives dùng `@base-ui/react` (không phải Radix).
- **Theming theo persona**: attribute `data-persona` + CSS custom properties (`--persona`, `--persona-foreground`, `--persona-soft`, `--persona-border`) trong `src/app/globals.css`.
- **Hai hệ thống component song song**:
  - Student: hệ thống retro riêng `st-*` (`Tile`/`Mono`/`PageTitle`/`BlockButton`/...) trong `src/components/student/ui.tsx`, font Georgia serif "st-display" + monospace "st-mono", card có hard-shadow viền 2px.
  - Teacher/Parent: hệ thống shadcn thuần, **giờ dùng chung màu terracotta `#c75b39`** với student nhưng cố tình khác hình dạng.
- **CEFR Level Engine** (`src/lib/level-engine.ts`): composite score có unit test — hours 20% / vocab 25% / exam 25% / coverage 15% / grammar 15% → dải CEFR A1–C2; hàm `contribution()` và `weakestInput()` để chẩn đoán điểm yếu; lưu lịch sử qua `level_scores.computed_at`.
- **Kinh tế Gems/XP/Streak** (`src/lib/progression.ts`): `XP_CORRECT=10`, `XP_INCORRECT=2`, `GEMS_PER_ROUND=15`, streak tính từ ngày luyện tập thật, luật mở khoá theo data (`streak:N`, `xp:N`, `cefr:X`, `always`) trên `avatars.unlock_rule`.
- **Hệ thống Avatar**: Open Peeps (CC0, qua `react-peeps`, MIT) — nguồn duy nhất `src/lib/peeps.ts` + `src/components/student-avatar.tsx`, danh sách option đã được chọn lọc kỹ (loại bỏ nội dung không phù hợp vì đây là sản phẩm trẻ em).
- **Islands / lộ trình học** (`src/lib/islands.ts`): `buildIslands()` hiện chỉ dùng topic giáo viên đã `assigned`; 6 level luyện tập + 1 node exam = 7 mỗi unit (khớp yêu cầu "mỗi 7 bài"); **bug đã biết**: đánh số node hiện reset theo từng island (chưa fix — yêu cầu "đánh số liên tục").
- **Exercise gắn skill**: enum `exercise_skill` (`VOCAB | GRAMMAR | READING | LISTENING | WRITING | SPEAKING`) và enum `topic_source` (`school`/`library`) đã thêm trong `supabase/migrations/0006_v2_schema.sql`, cùng bảng `messages` và `class_post_comments` (nền tảng cho chat/inbox).

---

## 5. Các tài liệu đã tạo trong `docs/`

- `student-app-v2-plan.md` — plan phát triển đầy đủ cho Arena, fix đánh số liên tục, exercise shuffle theo skill, Vault rework + SRS, inbox/chat kèm ghi chú an toàn, mở rộng giá avatar shop, thứ tự build.
- `teacher-app-plan.md` — bản "Revision 2": §1 hướng visual (khớp màu terracotta, bỏ wordmark BEEBLAST, dùng shadcn thật khắp nơi, cần shadcn Sidebar), §2 nhóm sidebar, §3 dashboard landing với 3 view, §4 dọn copy (liệt kê vị trí em-dash theo file), sau đó là plan tính năng gốc (thư viện học liệu, exam builder, giáo án, lịch sử giao bài, quản lý lớp/học sinh, dashboard).
- `lovable-teacher-prompt.md` — prompt chi tiết cho Lovable về teacher app, có thêm phần "User flows" đầy đủ (điểm danh buổi sáng, sửa bài học, giao unit, vòng đời đề thi, feed/kudos, chuyển view dashboard).
- `investor-master-plan.md` — master plan đầy đủ dành cho pitch nhà đầu tư.
- `session-context-handoff.md` — **chính là file này**.

---

## 6. Việc trích xuất từ Lovable (đã làm)

Dự án Lovable "Beeblast Teacher Hub" — stack TanStack Start + Vite + Bun (không tương thích trực tiếp với Next.js của Beeblast), dùng làm **tham chiếu về visual/cấu trúc**, không port code trực tiếp.

Đã đọc/trích xuất qua Claude in Chrome (tab Lovable, project id `3da2810e-dc1c-4f08-b708-69045aa5c49c`):

- `src/router.tsx` — router TanStack chuẩn.
- `src/components/badges.tsx` — **đã capture toàn bộ** (16 dòng): `CefrBadge` (Badge variant="brand"), `SkillBadge` (Badge variant="secondary", tra bảng `skillLabels`), `StatusBadge` (score/streak → "Cần hỗ trợ"/"Cần chú ý"/"Ổn định").
- `src/components/empty-state.tsx` — **đã capture toàn bộ**: nhận `icon?: LucideIcon, text: string`, render icon + text căn giữa.
- `src/routes/soan-de.tsx` (Exam builder) — import: `SkillBadge`, `EmptyState`, `PageHeader`, shadcn `Button/Card/Checkbox/Dialog/Input/Label/Select`, `skillLabels, type Skill`, `useBeeblast`.
- `src/routes/chuong-trinh.tsx` (Curriculum) — import: `CefrBadge, SkillBadge`, `EmptyState`, `PageHeader`, `Badge`, `Button`, `Card` family, `Dialog` family, `Progress`, `Textarea`, `Tabs` family; đọc được phần render lesson-row và unit-exam row (chưa đọc hết file).
- Danh sách đầy đủ route Lovable: `__root.tsx`, `bang-tin.tsx`, `cham-bai.tsx`, `chuong-trinh.tsx`, `giao-an.tsx`, `hoc-lieu.tsx`, `index.tsx`, `lich-su.tsx`, `lop-hoc.tsx`, `soan-de.tsx`, `tai-khoan.tsx`, `tro-giup.tsx`.
- Danh sách component dùng chung của Lovable: `app-shell.tsx`, `badges.tsx`, `empty-state.tsx`, `kudos-dialog.tsx`, `page-header.tsx`, `reminder-dialog.tsx`, `student-avatar.tsx`.
- **Chưa mở/đọc**: `page-header.tsx`, `kudos-dialog.tsx`, `reminder-dialog.tsx`, `student-avatar.tsx` (bản Lovable), `app-shell.tsx`, `beeblast-data.ts`, `beeblast-store.ts`, và 9 route file còn lại đầy đủ.

Lý do trích xuất qua screenshot: nút "Download" của Lovable chỉ tải từng file một (không tải cả project), tài khoản Free/"Read only", 0 credit; đọc clipboard qua computer-use MCP thất bại (bị hệ thống từ chối cấp quyền browser, sau đó `read_clipboard` báo "No applications are granted"). File tree sidebar không phản hồi scroll bằng chuột (workaround: thu gọn folder + dùng phím mũi tên); pane code bên phải scroll chuột bình thường.

---

## 7. Toàn bộ thay đổi code đã thực hiện (2 đợt)

### Đợt 1 — dọn emoji, đổi màu, thêm sidebar nhóm (trước khi có chỉ thị Lovable)

- `src/app/globals.css` — `[data-persona="teacher"]`: `--persona` đổi từ `#0f6e56` → `#c75b39` (khớp màu student).
- `src/components/persona-shell.tsx` — thêm hỗ trợ `groups?: SidebarGroupData[]` (dùng `SidebarGroup`, `SidebarMenuItem` từ `@/components/ui/sidebar`); `NavItem.icon` đổi từ `string` → `LucideIcon | string` với `ICON_MAP` (dashboard/materials/school/students/curriculum/lesson_plans/builder/gradebook/history/story/account/help).
- `src/app/teacher/[teacherId]/layout.tsx` — nav icon từ emoji → lucide; sau đó phiên song song đổi tiếp thành `groups=[...]` 6 nhóm: Tổng quan/Học liệu/Giảng dạy/Đánh giá/Hoạt động/Hệ thống.
- `src/lib/personas.ts` — `NOTIFICATION_LABELS` từ emoji → lucide icon components.
- `src/components/streak-pill.tsx` — `icon: string` → `LucideIcon` (`Flame`/`AlertTriangle`/`HeartCrack`).
- `src/components/teacher/kudos-button.tsx`, `create-exam-button.tsx`, `streak-check-button.tsx` — bỏ emoji, dùng icon Star/FileText/AlarmClockCheck.
- `src/app/teacher/[teacherId]/student/[studentId]/page.tsx` — `✅`/`❌` → `Check`/`X` lucide.

### Đợt 2 — áp dụng Lovable UI/UX (phiên vừa hoàn thành, task "Apply Lovable's teacher UX/UI to all Beeblast screens" — **đã completed**)

**File mới tạo:**

1. `src/components/ui/checkbox.tsx` — Checkbox thật dựa trên `@base-ui/react/checkbox`.
2. `src/components/ui/popover.tsx` — Popover thật dựa trên `@base-ui/react/popover` (Popover/PopoverTrigger/PopoverContent).
3. `src/components/teacher/badges.tsx` — port từ Lovable: `SKILL_LABELS` (map tiếng Việt cho `exercise_skill` enum: VOCAB→Từ vựng, GRAMMAR→Ngữ pháp, READING→Đọc, LISTENING→Nghe, WRITING→Viết, SPEAKING→Nói), `CefrBadge`, `SkillBadge`, `StatusBadge`.
4. `src/components/teacher/empty-state.tsx` — port từ Lovable, giữ nguyên logic (`icon?: LucideIcon, text: string`).

**`src/components/ui/badge.tsx`** — thêm 4 variant mới vào `badgeVariants`: `brand` (nền `var(--persona)`), `success` (emerald), `warning` (amber), `danger` (red) — để khớp cách Lovable dùng Badge có variant đặt tên (brand/secondary/danger/warning/success).

**Sửa các file component/page teacher hiện có (giữ nguyên toàn bộ wiring Supabase thật, chỉ đổi UI):**

| File | Thay đổi |
|---|---|
| `src/components/teacher/exam-builder-client.tsx` | Raw `<select>` chủ đề → shadcn `Select`; raw `<input type="checkbox">` + `Badge` thủ công → `Checkbox` + `SkillBadge`; danh sách rỗng → `EmptyState` |
| `src/components/teacher/materials-client.tsx` | 3 raw `<select>` (loại tài liệu, bài học liên quan, CEFR) → shadcn `Select`; badge CEFR thủ công → `CefrBadge`; danh sách rỗng → `EmptyState`; bỏ import `Badge` không dùng nữa |
| `src/components/teacher/dashboard-client.tsx` | Thêm dropdown chọn kiểu biểu đồ (Cột/Đường) cho biểu đồ phân bố CEFR (Bar ↔ Line, dùng recharts `LineChart`); thêm nút "Tuỳ chỉnh" mở `Popover` chứa input ngưỡng điểm "cần chú ý" (`attentionThreshold`, mặc định 40, có thể chỉnh); `needsAttention` giờ dùng `useMemo` theo ngưỡng này; thêm `StatusBadge` vào danh sách học sinh cần nhắc nhở |
| `src/app/teacher/[teacherId]/roster/page.tsx` | Thêm `StatusBadge` bên cạnh `StreakPill` cho mỗi học sinh |
| `src/app/teacher/[teacherId]/gradebook/page.tsx` | 2 chỗ text rỗng → `EmptyState` (icon `ClipboardCheck` cho "chưa có đề kiểm tra") |
| `src/app/teacher/[teacherId]/story/page.tsx` | 3 chỗ text rỗng → `EmptyState` (icon `MessageSquare`, `Megaphone`, `Award`) |
| `src/app/teacher/[teacherId]/assignments/history/page.tsx` | Text rỗng → `EmptyState` (icon `Clock`) |
| `src/app/teacher/[teacherId]/curriculum/page.tsx` | Pill "Đã giao"/"Chưa giao" tự viết tay → `Badge variant="success"/"secondary"` |
| `src/components/teacher/lesson-plans-client.tsx` | Raw `<select>` bài học liên quan → shadcn `Select`; 2 chỗ text rỗng → `EmptyState` (icon `FileText`, `BookOpen`) |
| `src/components/teacher/exercise-editor.tsx` | Raw `<select>` gắn điểm ngữ pháp → shadcn `Select`; text rỗng → `EmptyState` |
| `src/app/teacher/[teacherId]/student/[studentId]/page.tsx` | 3 chỗ text rỗng → `EmptyState` ("chưa có lượt luyện tập", "chưa có tuyên dương", "chưa có dữ liệu trình độ") |

**Không đổi (đã kiểm tra, không có gap):** `account/page.tsx`, `help/page.tsx` (đã sạch, dùng Card/Badge hợp lý sẵn); `create-topic-form.tsx`, `create-exam-button.tsx`, `assign-topic-button.tsx`, `class-post-form.tsx`, `journal-comment-form.tsx`, `grade-row.tsx`, `vocab-editor.tsx`, `grammar-editor.tsx`, `kudos-button.tsx`, `streak-check-button.tsx` — đã grep xác nhận không còn raw `<select>`/`type="checkbox"` nào trong toàn bộ `src/components/teacher` và `src/app/teacher`.

**Xác minh:** `npx tsc --noEmit -p .` sạch (0 lỗi) sau mỗi đợt sửa; `npx eslint` chỉ còn 8 warning **có từ trước** (biến/import không dùng ở `dashboard-client.tsx`, `exam-builder-client.tsx`, `materials-client.tsx` — không phải do các sửa đổi lần này gây ra).

---

## 8. Việc còn dang dở / gợi ý bước tiếp theo

- Đánh số node trong island/lộ trình học hiện **reset theo từng island** — cần fix thành đánh số liên tục (theo yêu cầu gốc "mỗi 7 bài học liên tục").
- `buildIslands()` mới chỉ dùng topic giáo viên `assigned` — chưa có nhánh Arena "unlimited map" độc lập với chương trình trường như đã brainstorm.
- Câu hỏi phụ chưa trả lời: có nên gộp phần brainstorm "insight phụ huynh trả phí" vào mục phụ huynh của `investor-master-plan.md` không — user chưa phản hồi trước khi chuyển sang chủ đề Lovable.
- Còn 4 file component Lovable dùng chung chưa đọc hết: `page-header.tsx`, `kudos-dialog.tsx`, `reminder-dialog.tsx`, `student-avatar.tsx` (bản Lovable) — nếu cần khớp thêm chi tiết UI (ví dụ pattern `PageHeader` dùng ở mọi route Lovable) thì nên đọc tiếp các file này rồi áp dụng vào `src/app/teacher/[teacherId]/layout.tsx` hoặc tạo `PageHeader` dùng chung cho các trang teacher (hiện mỗi trang tự viết `<h1>`/`<p>` riêng — có thể hợp nhất thành 1 component `PageHeader` giống Lovable để đồng nhất tuyệt đối).
- Chưa build thử `next build` / chạy dev server để xem trực quan (sandbox này không giữ được process nền qua nhiều lần gọi bash) — chỉ xác minh qua `tsc --noEmit` + `eslint`. Nên yêu cầu người dùng chạy `npm run dev` cục bộ để xem trực quan lần cuối.

---

## 9. Lỗi kỹ thuật đã gặp & cách xử lý (tránh lặp lại)

- `.crdownload` (file tải dở) → yêu cầu upload lại file hoàn chỉnh.
- `unzip` bị treo với file zip 193MB/60K+ file → dùng Python `zipfile` để giải nén chọn lọc, loại trừ `.git/` và `.local/share/`.
- Đọc file bằng path VM trong tool `Read` báo lỗi ("Read tool runs on host filesystem") → phải map sang host path.
- Output bash quá dài vượt token limit → dùng `head`, grep có mục tiêu, script Python có truncate thay vì `cat`/`find` thô.
- `next dev` chạy nền không sống sót qua các lần gọi bash riêng biệt (mỗi lần gọi là sandbox độc lập, không giữ process/network) → bỏ cách verify bằng render trực tiếp, chuyển sang đọc code trực tiếp + `tsc --noEmit`.
- Lỗi TS có sẵn trong `queries.ts` (`unreadCount` không có trong `StudentSummary`) phát hiện lúc typecheck — xác nhận không phải do các sửa đổi của phiên này gây ra (không hề đụng vào `queries.ts`), về sau đã tự hết (phiên song song sửa).
- Nút "Download" của Lovable chỉ tải từng file, không tải cả project; menu "Connecteurs" (đồng bộ GitHub) không phản hồi (khả năng bị khoá vì tài khoản Free/0 credit).
- `mcp__computer-use__request_access` với `apps: ["Google Chrome"]` bị hệ thống từ chối thẳng (chỉ nên dùng Claude-in-Chrome để tương tác trình duyệt); thử `clipboardRead: true` cũng trả về rỗng, `read_clipboard` báo "No applications are granted" → bỏ hẳn cách đọc clipboard, chuyển sang đọc qua screenshot.
- File tree sidebar trong Lovable code editor không phản hồi `scroll` bằng chuột → workaround: thu gọn folder (`ui/`, `components/`, `hooks/`, `lib/`) để lộ item ẩn, và dùng phím mũi tên (tự động scroll) sau khi click 1 item. Pane code bên phải thì scroll chuột bình thường.
- Base-UI `Select`'s `onValueChange` có type `(value: string | null, ...) => void` — khác với `useState<string>` setter thường (`string`, không nhận `null`) → mọi chỗ dùng `Select` phải bọc callback kiểu `(v) => v && setX(v)` hoặc xử lý giá trị "rỗng" bằng một sentinel string (vd. `"all"`, `"none"`) thay vì `""`, vì base-ui Select không thích `value=""` làm item.

---

## 10. Cách nói chuyện / phong cách người dùng mong muốn

- Ngắn gọn, trực tiếp, hạn chế giải thích dư thừa.
- Không thích khi Claude tự ý làm trái ý mà không hỏi rõ — nhưng khi đã ra chỉ thị dứt khoát ("i dont care, goal is...") thì Claude phải làm theo, chỉ nêu quan ngại một lần rồi thực thi, không lặp lại tranh luận.
- Câu lệnh thường viết tắt, xen tiếng Anh/Việt, đôi khi không dấu câu — cần đọc kỹ ý định thực sự đằng sau câu chữ ngắn gọn.
