# Beeblast — Fix khẩn: Vi phạm design system + Chọn thành viên lớp + UX theo persona học sinh tiểu học v1

Đã đọc trực tiếp source code (`/Users/ad/Documents/Beeblast/src`) chứ không chỉ click ngoài UI, nên phần này chính xác theo đúng code đang chạy, không phải đoán.

---

## 1. "Trợ giúp hiện thông báo ngoài app" — KHÔNG PHẢI notification hệ điều hành, mà là vi phạm design system trên diện rộng

### Kiểm chứng
- Đọc `components/student/help-modal.tsx`: nút Báo sự cố chỉ gọi `fetch("/api/student/report-issue")` rồi `showToast(...)` — toast trong app, không có `new Notification()` / `window.Notification` / `requestPermission()` ở đâu trong code (đã grep toàn bộ `src`, không có kết quả). Test tay xác nhận: bấm Gửi → chỉ hiện toast trong app, không có popup hệ điều hành nào.
- Vậy cảm giác "thông báo ngoài app" đến từ chỗ khác: **modal Help dùng hẳn 1 bộ màu khác hoàn toàn** — `bg-slate-900`, `border-slate-700`, `text-amber-300`, nút `bg-sky-500`, `bg-rose-600` — trong khi màu thật của app là theme be/cam đất khai báo ở `app/globals.css` (`--st-bg: #efe3cf`, `--st-card: #f4ecdd`, `--st-primary: #c75b39`, `--st-accent: #d9a441`...). Modal tối màu, chữ vàng/xanh neon nhảy ra giữa 1 app nền be ấm — nhìn giống hệt 1 app/quảng cáo khác đè lên, đúng cảm giác "ngoài app" dù kỹ thuật không phải notification thật.

### Đây KHÔNG phải lỗi riêng lẻ — đã grep toàn bộ codebase, tìm thấy ở 27 file
Tất cả các file dưới đây đang hardcode class Tailwind mặc định (`slate-`, `black`, `amber-`, `sky-`, `rose-`) thay vì dùng token `st-*`/`var(--st-*)` đã định nghĩa sẵn — tức là gần như MỌI tính năng mới vừa build theo các FRS trước (luyện nói, grammar dialogue, cloze reading, collocation, submission viewer, chấm bài, portfolio...) đều bị:

| Số lần vi phạm | File |
|---|---|
| 38 | `components/student/vault-client.tsx` |
| 36 | `components/student/submission-form.tsx` |
| 30 | `components/student/shop-client.tsx` |
| 29 | `components/teacher/grade-row.tsx` |
| 27 | `components/teacher/student-portfolio-detail-client.tsx` |
| 27 | `components/student/help-modal.tsx` |
| 23 | `components/submission-viewer.tsx` |
| 23 | `components/student/speaking-exercise-client.tsx` |
| 17 | `components/teacher/class-post-form.tsx` |
| 14 | `components/teacher/portfolio-client-list.tsx` |
| 12 | `components/student/grammar-dialogue-exercise.tsx` |
| 12 | `components/student/collocation-exercise.tsx` |
| 12 | `components/student/cloze-reading-exercise.tsx` |
| 11 | `components/student/vault-review-client.tsx` |
| 7 | `components/student/journal-prompt.tsx` |
| 7 | `app/teacher/[teacherId]/student/[studentId]/page.tsx` |
| ≤5 | `toast-container.tsx, lesson-node.tsx, exercise-editor.tsx, portfolio/[studentId]/page.tsx, button-state.tsx, sidebar.tsx, dialog.tsx, kudos-button.tsx, accessory-picker.tsx, persona-shell.tsx, level-breakdown.tsx, level-bar.tsx, curriculum/page.tsx` |

**Xác nhận trực quan trên Teacher app**: mở `/teacher/{id}/portfolio` — thấy ngay tile "Nhật ký mới nhất" của Minh bị tô nền xanh navy tối giữa 1 trang nền trắng be — cùng 1 kiểu lỗi, không phải trường hợp cá biệt của Help modal.

### Quy tắc bắt buộc để fix dứt điểm (đưa thẳng cho Antigravity)
1. **Cấm dùng mọi class Tailwind màu mặc định** (`slate-`, `gray-`, `zinc-`, `neutral-`, `sky-`, `rose-`, `amber-`, `emerald-`, `black`, `white` trực tiếp...) trong toàn bộ `src` — app không có dark mode, không có lý do tồn tại nền tối.
2. Chỉ dùng token đã khai báo: `bg-st-bg, bg-st-card, text-st-fg, text-st-muted-fg, bg-st-primary, text-st-primary-fg, bg-st-secondary, bg-st-muted, bg-st-accent, bg-st-peach, bg-st-destructive, border-st-input` (xem đầy đủ ở `app/globals.css` dòng 177–215).
3. Bảng quy đổi nhanh cho 27 file trên: `slate-900/800/700 (nền tối) → bg-st-card` (nếu là card thường) hoặc giữ đúng nền trang `bg-st-bg`; `text-amber-300/400 → text-st-accent`; `bg-sky-500 → bg-st-primary` hoặc `bg-st-secondary` tuỳ ngữ cảnh nút chính/phụ; `bg-rose-600 → bg-st-destructive`; `border-slate-700 → border-st-input` hoặc `border-st-fg`.
4. Thêm bước lint/review bắt buộc trước khi merge bất kỳ component mới nào: quét `grep -rn "slate-\|sky-\|rose-\|amber-\|emerald-\|zinc-\|gray-" src` phải trả về rỗng.

---

## 2. "Select class member" — đổi thành dropdown thay vì hàng chip tràn ngang

### Kiểm chứng code
`components/student/inbox-client.tsx` dòng 190: `<div className="flex gap-2 overflow-x-auto pb-1">` — hàng chip NÀY THỰC RA ĐÃ cuộn ngang được (`overflow-x-auto`), không phải bị đứng im. Nhưng không có bất kỳ chỉ báo thị giác nào (không có mờ dần ở mép phải, không có scrollbar, không có mũi tên) báo cho học sinh biết còn nội dung phía sau ("Bảo" bị cắt nửa chữ ở mép) — nên nhìn như bị lỗi/cắt cụt chứ không như 1 danh sách cuộn được. Với học sinh tiểu học, im lặng-nhưng-cuộn-được còn tệ hơn bị lỗi rõ ràng, vì các em sẽ không nghĩ tới việc vuốt ngang.

### Fix theo đề xuất của anh — đổi qua dropdown
- Thay hàng chip bằng 1 dropdown/select đơn: hiện tên người đang chat (mặc định "Cô Linh") + icon mũi tên xuống, bấm mở ra danh sách đầy đủ tất cả thành viên lớp theo chiều dọc (dễ nhìn, dễ bấm hơn cuộn ngang với tay trẻ nhỏ trên điện thoại).
- Text lớn hơn, mỗi dòng cách nhau đủ rộng cho ngón tay trẻ em bấm trúng (tối thiểu 44px chiều cao mỗi dòng).
- Giữ nguyên logic chọn (bấm 1 người → load đúng thread của người đó), chỉ đổi phần hiển thị danh sách.
- **Test case**: lớp có >10 học sinh → dropdown vẫn hiện đủ, cuộn dọc bên trong dropdown, không tràn ngang màn hình nữa.

---

## 3. Rà theo persona học sinh tiểu học — số/phần trăm không phải thứ trẻ con quan tâm

Đúng như anh nói — nhìn lại các màn hình đã chụp với góc nhìn 1 đứa trẻ tiểu học (6–11 tuổi), phát hiện:

- **"B2 — 27.3% to C1"** ở đầu Learn, **"52.2/100"** ở Profile, **"58.5/100 · 92.5% tới B2"** ở Roster giáo viên — toàn bộ là số liệu CEFR/phần trăm trừu tượng. Một đứa trẻ tiểu học không hiểu "CEFR B2 nghĩa là gì" và không có cảm xúc gì với con số "27.3%" — số này chỉ có ý nghĩa với giáo viên/phụ huynh, không phải với chính đứa trẻ đang dùng app hàng ngày.
- Khu vực học sinh nhìn thấy MỖI NGÀY (đầu trang Learn) đang ưu tiên hiển thị đúng con số ít cảm xúc nhất trong cả app, trong khi streak 🔥 và gems 💎 (cái duy nhất trẻ con thực sự thích thú) bị đẩy lên header nhỏ, không phải điểm nhấn chính.
- FAQ trong Help modal cũng viết theo văn phong người lớn ("Streak tính theo việc hoàn thành bài luyện tập hàng ngày...") — đúng ngữ pháp nhưng dài dòng, trẻ tiểu học đọc ngại.

### Đề xuất đổi (không đụng vào số liệu CEFR thật — vẫn giữ nguyên cho Giáo viên/Phụ huynh xem, chỉ đổi CÁCH HIỂN THỊ phía học sinh)
- **Header Learn**: thay vì "B2 — 27.3% to C1" làm khối to nhất đầu trang, đổi thành 1 thanh cấp độ dạng game (VD "Cấp 7 🐝" + thanh đầy dần có icon ong/nhân vật mascot), số CEFR/% chuyển xuống dạng nhỏ/phụ hoặc ẩn hẳn khỏi màn hình học sinh (chỉ hiện ở Profile dưới dạng "thông tin chi tiết" cho ai tò mò, không phải thứ đập vào mắt đầu tiên).
- **Profile**: "Score 52.2/100" đổi thành đại lượng trực quan hơn — số sao ⭐, số huy hiệu 🏅, hoặc thanh "gần đạt cấp mới" có mascot, giữ số thật (52.2/100) ở dạng chữ nhỏ bên dưới cho ai cần.
- **Vault "8 words · 2 rules"**, **"92.5% tới B2"**... nói chung: bất kỳ đâu hiển thị cho HỌC SINH thấy, ưu tiên icon + màu + hình ảnh trước, số liệu đưa xuống hàng phụ, chữ nhỏ.
- Số liệu CEFR%/điểm/100 thật vẫn giữ nguyên đầy đủ, chính xác ở phía Giáo viên (Roster, Chấm bài) và (khi có) Phụ huynh — đối tượng đó CẦN số liệu để ra quyết định, khác học sinh.
- FAQ Help: rút ngắn câu trả lời xuống 1 câu đơn giản, có thể thêm icon minh hoạ đầu mỗi câu hỏi thay vì toàn chữ.

**Nguyên tắc chung**: 1 dữ liệu (VD % tiến độ), nhưng 2 cách trình bày theo đối tượng xem — học sinh thấy bản "vui/trực quan", giáo viên/phụ huynh thấy bản "số liệu chính xác". Không phải xoá số liệu, mà là không ép trẻ con nhìn số liệu người lớn.

---

## 4. Rà nhanh phía Giáo viên (đã inspect qua Claude in Chrome)

- Các mục theo FRS trước đã lên: `Portfolio Học sinh` trong sidebar hoạt động đúng (danh sách học sinh, số bài viết/nói, trạng thái duyệt), `Tổng quan` đã có icon ⓘ giải thích "Điểm trung bình" và "Cần chú ý" đúng như đã đặc tả, sidebar đã có `Trợ giúp`.
- Vẫn còn lỗi double-click cũ (bấm 1 lần vào menu sidebar thường không phản hồi, phải bấm lại) — CHƯA được fix, vẫn y hệt lần QA đầu tiên, dù đã có nhiều tính năng mới lên. Đây vẫn là lỗi ưu tiên cao nhất theo đúng thứ tự đã ghi ở FRS v2 §0 (state machine 4 bước cho mọi nút) — nếu Antigravity đang code tính năng mới mà bỏ qua phần nền tảng này thì lỗi sẽ tiếp tục lặp ở mọi tính năng mới thêm vào.
- Tile "Nhật ký mới nhất" trong Portfolio bị dính đúng lỗi màu nền tối ở mục 1 — cần fix chung 1 lượt với toàn bộ 27 file đã liệt kê, không sửa riêng lẻ.
