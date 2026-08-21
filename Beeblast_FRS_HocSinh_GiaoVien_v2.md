# Beeblast — FRS Học sinh & Giáo viên v2 (bản chốt để giao code)

Bản này thay thế v1: các mục "[CẦN CHỐT]" đã được quyết định thành business rule cụ thể (mục 6), bổ sung mục Help/Trợ giúp cho Account, thiết kế lại Avatar Shop để hết lỗi giật/chớp hình, và thêm spec Supabase Auth để có thể giao thẳng cho AI coding agent build mà không cần hỏi lại. Phụ huynh vẫn để giai đoạn sau (portal chưa dựng).

---

## 0. Nguyên tắc nền (áp dụng toàn bộ tài liệu)

- **Không optimistic-fake-success**: hành động ghi dữ liệu chỉ hiện "thành công" SAU khi API xác nhận đã lưu.
- **State machine 4 bước cho mọi nút gọi API**: `Default → Pressed (<100ms) → Loading (nếu >300ms, spinner + disable double-tap) → Success/Error rõ ràng`.
- **1 component Toast dùng chung**: `{message, type: success|error|info, duration: 3000ms, dismissible: true}`, tự dismiss đúng hạn, xếp chồng tối đa 3, không đè icon header.

---

## 1. Data model

| Entity | Field chính | Ghi chú |
|---|---|---|
| `profiles` | `id (=auth.users.id), role: teacher\|student\|parent, full_name, avatar_config jsonb, school_id, class_id, created_at` | nền tảng auth, xem mục 7 |
| `VocabItem` | `word, meaning_vi, example_en, audio_url, unit_id` | |
| `GrammarRule` | `title, explanation_vi, example_dialogue[], unit_id` | |
| `JournalEntry` | `id, student_id, unit_id, type: text\|audio, content, audio_url, status: draft\|submitted\|approved\|rejected, teacher_comment, teacher_comment_audio_url, star_rating, created_at, approved_at` | |
| `SpeakingAttempt` | `id, student_id, lesson_id, audio_url, model_audio_url, overall_score (nullable), attempt_number, created_at` | giai đoạn 1 không có `per_word_score` — xem mục 6.2 |
| `VocabReviewLog` | `student_id, vocab_id, result: remembered\|forgot, next_review_at` | |
| `XPLedger` | `id, student_id, source: lesson_first\|lesson_replay\|journal_approved\|speaking_graded, amount, ref_id, created_at` | nguồn duy nhất để tính CEFR%, xem mục 6.1 — không cộng trực tiếp vào 1 cột số nguyên rải rác |
| `cefr_thresholds` | `band: A1\|A2\|B1\|B2\|C1\|C2, xp_required` | bảng cấu hình, không hardcode trong code |
| `Notification` | `id, type, message, target_role, target_id, read_at` | |
| `Grade` | `score, graded_by: auto\|teacher, comment, comment_audio_url, is_confirmed_by_teacher: bool` | |
| `AvatarItem` | `id, category: hair\|face\|hats\|clothes\|stance, asset_url, price_gems, z_index` | dùng cho mục A11 |
| `StudentAvatarOwnership` | `student_id, avatar_item_id, purchased_at` | |

---

## 2. Đặc tả — App Học sinh

### A1. Vault — thẻ từ vựng/ngữ pháp bấm được
- Tap chip → modal: `meaning_vi`, `example_en`, nút loa phát `audio_url`. `audio_url = null` → disable icon + tooltip "Chưa có audio".
- API lỗi khi mở modal → nút "Thử lại" trong modal, không tự đóng.
- **Test**: (1) từ đủ data hiện đúng; (2) từ thiếu audio icon disable không crash; (3) bấm nhanh nhiều từ liên tiếp → nội dung luôn khớp từ bấm cuối; (4) mất mạng → có nút thử lại, không treo trắng.

### A1b. Flashcard Review
- Full-screen, thứ tự theo `next_review_at` sớm nhất (SM-2 rút gọn). Lật thẻ → 2 nút "Chưa nhớ"/"Đã nhớ" ghi `VocabReviewLog`.
- Thưởng +20 gems / tuần, check `last_weekly_bonus_claimed_at` trước khi cộng — 2 lần/tuần chỉ cộng 1.
- **Test**: hoàn thành 2 lần cùng tuần → lần 2 không cộng thêm, báo rõ "Đã nhận thưởng tuần này rồi".

### A2. Vault — fix tràn tab filter
- `overflow-x: scroll` (mobile) / `flex-wrap` (≥768px). **Test**: 320–1920px không tab nào bị cắt chữ.

### A3. Nhật ký nộp bài
- `Collapsed → Expanded (textarea + mic + Gửi) → Submitted`. Nút Gửi disable nếu rỗng. `POST` xong mới đổi UI (không optimistic giả). API fail → giữ nội dung + toast lỗi.
- Thưởng khi được duyệt: xem mục 6.3 (không thưởng lúc nộp).
- **Test**: gửi → F5 vẫn "Đã gửi ✓"; ghi âm → Gửi đúng file; gửi rỗng bị chặn; rớt mạng không mất nội dung.

### A4. Luyện nói (exercise type mới: `speaking`)
- Câu mẫu + nút phát audio mẫu → nút tròn Record (tap 1 ghi/tap 2 dừng, tối đa 60s) → 2 nút "Giọng mẫu"/"Giọng của em" để so sánh.
- **Không auto-score ở giai đoạn 1** — xem mục 6.2. Sau khi ghi xong chỉ lưu `SpeakingAttempt`, hiện "Đã gửi, chờ giáo viên nghe và chấm".
- **Test**: ghi <1s bị chặn; ghi >60s tự dừng; từ chối quyền mic → hướng dẫn cấp quyền không crash; audio 2 nút không lẫn của câu khác.

### A5. Challenges — mở lại bài đã nộp
- Tap card `DONE`/`PENDING` → chi tiết câu hỏi/đáp án/điểm/nhận xét. `PENDING` không lộ điểm.
- **Test**: DONE đúng nội dung của chính nó; PENDING không hiện điểm giả.

### A6–A9. Toast / phản hồi nút / responsive / ngôn ngữ
Dùng nguyên tắc §0. Responsive: <768px giữ nguyên, ≥768px thêm sidebar trái + panel phải, giữ max-width nội dung chính. Ngôn ngữ: `CHECK→Kiểm tra, CONTINUE→Tiếp tục, FINISH→Hoàn thành`, khung UI tiếng Việt, nội dung bài học giữ tiếng Anh.

### A10. Help / Trợ giúp — bổ sung màn Account
Màn Account hiện có School / Class / Parent-Guardian / Change avatar / Avatar Shop, thiếu mục Trợ giúp (bên Giáo viên đã có sẵn trong sidebar).
- Thêm 1 dòng cuối, tách riêng khỏi nhóm "YOUR INFO" bằng khoảng trắng (đây là nhóm hỗ trợ, không phải thông tin cá nhân): icon ❓ **Trợ giúp** — tap mở modal gồm:
  - FAQ ngắn: "Vì sao mất streak?", "Gems dùng để làm gì?", "Đổi được PIN đăng nhập không?"
  - Nút "Nhắn cho giáo viên" → điều hướng thẳng vào thread chat Cô giáo đã có ở Inbox, KHÔNG tạo thread mới.
  - Nút lớn "Báo sự cố" (đơn giản, ít chữ, phù hợp trẻ nhỏ) → gửi `Notification` cho giáo viên kèm màn hình hiện tại (screenshot tự động nếu làm được) + ghi chú ngắn học sinh nhập.
- **Test**: tap Help mở đúng nội dung; "Nhắn cho giáo viên" vào đúng thread cũ, không nhân đôi thread.

### A11. Avatar Shop — thiết kế lại, fix lỗi giật/chớp khi cuộn & đổi tab
Nguyên nhân điển hình gây giật hình trong lưới avatar (áp dụng cả khi cuộn lẫn khi đổi tab category) và cách fix, làm đồng bộ cả 5 điểm:
1. **Ảnh chưa có kích thước cố định trước khi load** gây nhảy layout (CLS) → mọi item trong lưới khai báo `aspect-ratio` cố định + skeleton xám khi chờ ảnh, không để ảnh "pop" vào sau khi đã render xong khung.
2. **Đổi tab category re-mount toàn bộ lưới** → chớp trắng cả màn hình → giữ nguyên component lưới, chỉ đổi `items` qua state với `key` ổn định theo `avatar_item.id`, không unmount/remount cả danh sách.
3. **Preload ảnh tab kế tiếp**: prefetch asset của category khi user hover/gần chạm tab đó, để chuyển tab không phải chờ load lại từ đầu.
4. **Viền chọn (selected state)** đổi ngay khi tap theo state machine ở §0 (Pressed <100ms), không chờ tính toán lại layout lần 2 gây giật viền.
5. **Avatar preview lớn ở đầu trang** ghép nhiều lớp (tóc/mặt/mũ/áo theo `z_index`) → đổi 1 chi tiết chỉ re-render đúng layer đó, không render lại toàn bộ composite từ đầu.

**Luồng tương tác**:
- Tap item → preview lớn cập nhật ngay (optimistic vì mới là xem thử, chưa lưu) + viền cam hiện tức thì.
- Item chưa mở khoá (giá > 0, chưa sở hữu) → icon khoá + số gems hiển thị trên item; tap → dialog xác nhận mua trước khi trừ gems thật (theo §0, không trừ ngầm).
- Nút "Áp dụng" riêng để chốt lựa chọn, tách khỏi hành vi "xem thử" — tránh nhầm giữa lướt xem và đã lưu thật.

**Test case riêng**:
1. Chuyển 5 tab category liên tục thật nhanh → không khung trắng/giật, item giữ đúng kích thước dù ảnh chưa load xong.
2. Cuộn nhanh lưới >30 item → không nhảy vị trí item đã render.
3. Tap chọn item → preview cập nhật <100ms, viền chọn không nháy 2 lần.
4. Mua khi không đủ gems → dialog báo rõ, không trừ gems, không lỗi âm thầm.

---

## 3. Đặc tả — App Giáo viên

### B1. Chấm bài — hiện nội dung bài làm thật trước khi chấm
- Accordion mở rộng: câu hỏi gốc, câu trả lời thật (text hoặc audio player), ô điểm tay, nút 🎙 ghi nhận xét giọng nói, ô nhận xét text.
- "Tự chấm" chỉ hiện với câu có đáp án chuẩn cố định. Với bài tự luận/nói (theo quyết định 6.2: không auto-score) → nút đổi thành **"Nghe & chấm"**, giáo viên bắt buộc nghe/đọc bài làm và tự nhập điểm, `is_confirmed_by_teacher = true` chỉ khi giáo viên bấm Lưu điểm.
- **Test**: bài tự luận/nói không tự ra điểm khi chưa ai nghe/duyệt.

### B2. Roster — tách nhãn "Cần hỗ trợ"
- `điểm < 40` → tag đỏ "Điểm yếu". `streak = 0 hôm nay` → tag cam "Mất streak". Có thể hiện cả 2, không gộp chung 1 tag.
- **Test**: học sinh điểm cao chỉ mất streak → chỉ tag cam, không tag đỏ.

### B3. "Chi tiết →" → Portfolio
- Route `/teacher/{id}/portfolio/{student_id}`: liệt kê `JournalEntry + SpeakingAttempt + Grade` theo thời gian giảm dần, mỗi entry có control duyệt/từ chối + sao chấm nhanh.

### B4. Bảng tin — bước Preview trước khi đăng
- "Đăng thông báo" lần 1 → Preview (đúng như học sinh sẽ thấy) + "Sửa lại"/"Xác nhận đăng". Chỉ "Xác nhận đăng" mới `POST` thật. Đã đăng → icon sửa (giữ timestamp gốc, đánh dấu đã sửa) + icon xoá (confirm dialog).

### B5. Portfolio (mục mới, sidebar "Hoạt động")
- Lưới theo học sinh, mỗi card: preview, ngày, badge trạng thái, sao.
- Duyệt → `status = approved` → kích hoạt thưởng theo mục 6.3. Sao chấm nhanh: tap là lưu ngay, sửa lại được.

### B6. Tổng quan — tooltip định nghĩa chỉ số
- Icon ⓘ giải thích đúng công thức thật đang chạy cho "Điểm trung bình" và "Cần chú ý", khớp 100% với logic backend, không phải mô tả áng chừng.

---

## 4. Dependency map

1. `JournalEntry` → Portfolio (B5) → giáo viên Duyệt → +10 XP + 5 gems (6.3) → CEFR% cập nhật theo 6.1 → (khi có Parent portal) `Notification` cho phụ huynh.
2. `SpeakingAttempt` → Chấm bài (B1) → giáo viên nghe & chấm tay (6.2) → `Grade` → cộng `XPLedger.source = speaking_graded`.
3. `VocabReviewLog` → "Vocab learned" ở Profile, tính theo ngưỡng 6.4.
4. Toast (§0) và state machine nút (§0) dùng lại cho MỌI feature A1–B6, không viết riêng từng chỗ.
5. CEFR% hiển thị ở Learn, Profile, Roster, Chi tiết học sinh phải đọc từ CÙNG 1 nguồn tính (`XPLedger` + `cefr_thresholds`), không cache/tính riêng từng màn.

---

## 5. Vòng test lặp lại

- Test case ở mỗi mục A1–A11, B1–B6 là checklist bắt buộc.
- Sau khi merge 1 feature, chạy lại toàn bộ test case của các feature liên quan trong dependency map (mục 4), không chỉ test cái mới.
- Điều kiện "Done": (1) happy path đúng spec; (2) persist thật qua F5; (3) mất mạng giữa chừng không mất input người dùng; (4) không toast/nút kẹt loading; (5) đúng ở cả mobile (~375px) và desktop (~1440px); (6) nếu số liệu xuất hiện nhiều màn → khớp tuyệt đối giữa các màn (test bằng 2 tab mở song song).

---

## 6. Business Rules v1 (đã chốt)

**6.1 Công thức CEFR% — 1 nguồn duy nhất**
- Mỗi band có ngưỡng XP riêng trong bảng `cefr_thresholds` (đề xuất khởi điểm A1:200, A2:400, B1:600, B2:800, C1:1000 — điều chỉnh sau theo dữ liệu thật, nhưng LUÔN đọc từ bảng cấu hình, không hardcode).
- XP khi hoàn thành Lesson: lần đầu = 100% XP chuẩn của lesson; làm lại lesson đã hoàn thành = tối đa 20% XP chuẩn và không cộng quá 1 lần/ngày cho cùng 1 lesson (chặn cày XP bằng cách bấm lại bài cũ — fix trực tiếp lỗi thực tế đã gặp: làm lại bài cũ tăng % nhiều hơn học bài mới).
- `CEFR% = (XP trong band hiện tại / ngưỡng band tiếp theo) × 100`, làm tròn 1 số thập phân, cap 100% → tự động lên band, reset XP band mới về 0.
- Bỏ "Score/100" như 1 số tiến độ độc lập ở Profile (gây hiểu nhầm 2 thang đo). Profile hiển thị CEFR% làm chỉ số chính (giống Learn). Nếu vẫn cần điểm trung bình bài kiểm tra, đổi tên rõ thành "Điểm trung bình bài kiểm tra" (nguồn từ `Grade`, tách biệt hoàn toàn khỏi XP/CEFR).

**6.2 Luyện nói — giai đoạn 1 không auto-score**
- Chỉ ghi âm + lưu `SpeakingAttempt`, không tô màu đúng/sai từng từ, không điểm tự động.
- Giáo viên nghe và chấm tay qua B1 (điểm + nhận xét text/voice). Auto pronunciation-scoring để giai đoạn 2 (cần tích hợp bên thứ 3, không nằm trong scope bản này).

**6.3 Portfolio được duyệt → có thưởng**
- Giáo viên bấm Duyệt (không phải lúc nộp) → +10 XP + 5 gems.
- Bị từ chối → 0 XP/gems, `Notification` nhắc nộp lại, tạo bản ghi mới khi nộp lại (giữ lịch sử bản cũ, không ghi đè) — thưởng theo chất lượng được duyệt, tránh nộp bừa lấy thưởng.

**6.4 Ngưỡng "Vocab learned"**
- 1 từ tính "đã học" khi có ≥2 lần `remembered` LIÊN TIẾP (bị `forgot` xen giữa thì đếm lại từ đầu).
- Số hiển thị ở Profile = COUNT real-time từ `VocabReviewLog`, không lưu số đếm cứng riêng để tránh lệch dữ liệu.

---

## 7. Supabase Auth & Phân quyền

### 7.1 Vai trò & bảng
- Dùng Supabase Auth, mở rộng bằng bảng `profiles` (`id = auth.users.id, role, full_name, avatar_config jsonb, school_id, class_id`).
- `classes (id, name, teacher_id, school_id)`, `class_students (class_id, student_id)`, `parent_students (parent_id, student_id)` — 1 học sinh có thể có nhiều phụ huynh theo dõi, 1 phụ huynh có thể có nhiều con.

### 7.2 Kênh đăng nhập theo vai trò
- **Giáo viên**: email + password hoặc magic link.
- **Học sinh** (trẻ em, không tự đăng ký): giáo viên tạo tài khoản trước (invite), học sinh đăng nhập bằng mã lớp + PIN 4–6 số, không cần email — tối giản cho trẻ nhỏ.
- **Phụ huynh**: nhận link kích hoạt qua SMS/Zalo, xác thực bằng OTP số điện thoại, liên kết vào `parent_students`.

### 7.3 RLS — bắt buộc bật cho MỌI bảng chứa dữ liệu học sinh
- `profiles`/dữ liệu học sinh: đọc/sửa được chính mình (`auth.uid() = id`), hoặc giáo viên của lớp (`join class_students`), hoặc phụ huynh có liên kết (`join parent_students`).
- `journal_entries`, `speaking_attempts`: học sinh chỉ ghi bản ghi của chính mình; giáo viên đọc học sinh trong lớp mình; phụ huynh chỉ đọc của con mình, KHÔNG được ghi/sửa/xoá.
- `grades`: chỉ giáo viên của lớp ghi được; học sinh/phụ huynh chỉ đọc.
- `announcements`: giáo viên của lớp ghi; học sinh + phụ huynh của lớp đọc.
- Không dùng `service_role` key ở client (app di động/web) — chỉ dùng trong Edge Functions cho tác vụ cần bypass RLS (vd tổng hợp báo cáo lớp).

### 7.4 Session & tuân thủ dữ liệu trẻ em
- Session timeout hợp lý cho thiết bị dùng chung ở lớp học, không đăng nhập vĩnh viễn.
- Học sinh dưới 16 tuổi: cần bước phụ huynh đồng ý khi tạo tài khoản (theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân) — thêm cờ `parental_consent_at` trong `profiles` học sinh, chặn kích hoạt tài khoản nếu chưa có.
- Mọi bảng ghi dữ liệu (`JournalEntry`, `SpeakingAttempt`, `Grade`...) thêm cột `created_by = auth.uid()`, không tin ID gửi từ client.

---

## 8. Ghi chú bàn giao

Tài liệu này (v2) đã đủ để đưa cho AI coding agent / dev build trực tiếp: có data model, business rule đã chốt (mục 6), auth + RLS (mục 7), spec từng nút/trạng thái/test case theo màn hình. Việc còn lại ngoài scope: nội dung FAQ thật trong Help (A10), số liệu ngưỡng XP/gems cụ thể ở mục 6.1/6.3 là đề xuất khởi điểm — có thể chỉnh sau khi có dữ liệu thật, miễn giữ đúng cấu trúc (đọc từ bảng cấu hình, không hardcode).
