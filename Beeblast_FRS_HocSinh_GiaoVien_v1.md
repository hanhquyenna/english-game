# Beeblast — FRS bổ sung (Học sinh & Giáo viên) v1

Tài liệu này cụ thể hoá plan trước thành spec đủ chi tiết để code không phải đoán: định nghĩa data, trạng thái từng nút, edge case, và test case đính kèm mỗi tính năng. Phụ huynh vẫn để sau (portal chưa tồn tại). Chỗ nào chưa đủ dữ kiện để tự quyết định logic nghiệp vụ, em đánh dấu **[CẦN CHỐT]** thay vì tự bịa ra công thức — anh/PM cần xác nhận trước khi dev bắt tay vào.

---

## 0. Nguyên tắc nền (áp dụng toàn bộ tài liệu)

- **Không optimistic-fake-success**: mọi hành động ghi dữ liệu (nộp bài, nhận thưởng, chấm điểm...) chỉ được hiện trạng thái "thành công" SAU khi API xác nhận đã lưu, không hiện toast thành công rồi lưu ngầm — đây là nguyên nhân lỗi "Claim 100 Gems" mất khi F5 đã gặp thực tế.
- **Mọi nút gọi API dùng chung 1 state machine 4 bước**: `Default → Pressed (đổi trạng thái visual trong <100ms) → Loading (nếu chờ >300ms, hiện spinner + disable double-tap) → Success/Error (rõ ràng, có message)`. Không định nghĩa lại state này ở từng mục bên dưới nữa — mặc định áp dụng.
- **Mọi toast dùng chung 1 component**: `{message, type: success|error|info, duration: 3000ms, dismissible: true}`, tự dismiss đúng hạn, xếp chồng tối đa 3 cái, không đè icon header.

---

## 1. Data model liên quan (entity mới/mở rộng)

| Entity | Field chính | Ghi chú |
|---|---|---|
| `VocabItem` | `word, meaning_vi, example_en, audio_url, unit_id` | hiện Vault chỉ có `word`, cần bổ sung 3 field còn lại |
| `GrammarRule` | `title, explanation_vi, example_dialogue[], unit_id` | tương tự, hiện chỉ có `title` |
| `JournalEntry` | `id, student_id, unit_id, type: text\|audio, content, audio_url, status: draft\|submitted\|approved\|rejected, teacher_comment, teacher_comment_audio_url, star_rating, created_at, approved_at` | entity mới, thay cho ô "Write a few sentences" đang chết |
| `SpeakingAttempt` | `id, student_id, lesson_id, audio_url, model_audio_url, per_word_score[], overall_score, attempt_number, created_at` | entity mới cho bài luyện nói |
| `VocabReviewLog` | `student_id, vocab_id, result: remembered\|forgot, next_review_at` | phục vụ flashcard spaced-repetition |
| `Notification` | `id, type, message, target_role: student\|teacher\|parent, read_at` | chuẩn hoá thay vì badge số cố định như hiện tại |
| `Grade` (mở rộng) | thêm `graded_by: auto\|teacher, comment_audio_url, is_confirmed_by_teacher: bool` | tách rõ điểm AI gợi ý vs điểm giáo viên xác nhận |

**[CẦN CHỐT]** Công thức tính % CEFR (`X% to B2`) và `Score/100` ở Profile hiện là 2 số khác nhau, và thực tế QA cho thấy làm lại bài Unit cũ tăng % nhiều hơn bất thường so với học bài mới. Cần PM/BA chốt 1 công thức duy nhất, ví dụ dạng: `CEFR% = f(XP tích luỹ trong band hiện tại / ngưỡng lên band)`, và **chỉ 1 con số này được hiển thị ở mọi nơi** (Learn, Profile, Roster giáo viên) — không để 2 thang đo song song như hiện tại.

---

## 2. Đặc tả tính năng — App Học sinh

### A1. Vault — thẻ từ vựng/ngữ pháp bấm được
- **Trigger**: tap chip từ vựng hoặc grammar rule trong Vault > Materials.
- **Luồng**: tap → mở modal/bottom-sheet → gọi `GET /vocab/{id}` → hiện `meaning_vi`, `example_en`, nút loa.
- **Nút loa 🔊**: play `audio_url`; nếu `audio_url = null` → disable icon + tooltip "Chưa có audio", không được im lặng không phản ứng.
- **Đóng modal**: tap X hoặc tap ngoài, không ghi dữ liệu gì.
- **Edge case**: API lỗi → modal vẫn mở với nút "Thử lại", không đóng modal tự động.
- **Test case**:
  1. Tap từ có đủ dữ liệu → hiện đúng nghĩa/audio.
  2. Tap từ thiếu audio → icon loa disable, không crash.
  3. Tap liên tiếp nhiều từ khác nhau thật nhanh → nội dung modal luôn khớp từ vừa bấm cuối cùng (regression cho lỗi "bấm 1 lần không ăn" đã gặp — nếu fix ẩu, dễ sinh lỗi ngược là hiện nhầm data của lần bấm trước).
  4. Mất mạng khi mở modal → hiện nút Thử lại, không đứng màn hình trắng vô thời hạn.

### A1b. Flashcard Review (nút "Review Now" đã có sẵn, chưa rõ có chạy thật)
- **Luồng**: full-screen flashcard, thứ tự ưu tiên từ có `next_review_at` sớm nhất (SM-2 rút gọn). Mặt trước = từ + audio tự phát; tap/swipe lật sang mặt sau = nghĩa + ví dụ; 2 nút "Chưa nhớ"/"Đã nhớ" ghi vào `VocabReviewLog` và tính lại `next_review_at`.
- **Thưởng hoàn thành**: +20 gems, nhưng CHỈ 1 lần/tuần — cần field `last_weekly_bonus_claimed_at`, so sánh trước khi cộng.
- **Test case**: hoàn thành review 2 lần cùng tuần → lần 2 không cộng thêm gems, hiện rõ "Đã nhận thưởng tuần này rồi" (không hiện toast thành công giả).

### A2. Vault — sửa tràn tab filter
- Tab "Materials / My Vocab / My Grammar / This Week" tràn/cắt chữ → `overflow-x: scroll` trên mobile, `flex-wrap` trên ≥768px.
- **Test case**: resize 320px→1920px, không tab nào bị cắt chữ ở bất kỳ điểm nào.

### A3. Nhật ký nộp bài (fix + nâng cấp ô "Write a few sentences")
- **State**: `Collapsed (card tĩnh) → Expanded (textarea + nút mic + nút Gửi) → [nhánh text] gõ → Gửi → Submitted` hoặc `[nhánh audio] tap mic → Recording (waveform, tối đa 60s) → Preview (nghe lại/Xoá/Gửi) → Submitted`.
- **Nút Gửi**: disable nếu rỗng cả text lẫn audio. onClick → `POST JournalEntry{status:"submitted"}`; UI chỉ chuyển "Đã gửi ✓" SAU khi API trả về 200 (theo nguyên tắc §0); API fail → giữ nguyên nội dung đã nhập + toast lỗi, KHÔNG mất data người dùng gõ.
- **Nút mic**: xin quyền micro nếu chưa có; từ chối quyền → toast hướng dẫn cấp quyền, fallback vẫn cho gõ chữ.
- **Xem lại bài đã nộp**: nếu `status != draft`, mở lại card ở chế độ readonly (không cho sửa/gửi lại), hiện thêm `teacher_comment` nếu có.
- **Test case**:
  1. Gõ → Gửi → F5 lại vẫn "Đã gửi ✓" (persist thật, không phải optimistic giả).
  2. Ghi âm → nghe lại → Gửi → đúng file audio được lưu.
  3. Gửi khi rỗng → nút disable, không cho submit rỗng.
  4. Rớt mạng lúc bấm Gửi → nội dung không mất, không hiện "Đã gửi" trong khi chưa lưu.

### A4. Bài tập Luyện nói (loại bài mới trong `ExerciseType`)
- Thêm `speaking` vào enum hiện có (`multiple_choice, fill_blank, match_pairs`).
- **Luồng**: hiện câu mẫu + nút phát audio mẫu → nút tròn Record (tap 1 = ghi, đổi đỏ + waveform + timer; tap 2 = dừng) → sau khi dừng hiện 2 nút "🔊 Giọng mẫu" / "🔊 Giọng của em" + nút "Ghi lại".
- **[CẦN CHỐT]**: Giai đoạn 1 có dùng dịch vụ chấm phát âm tự động (speech scoring API) hay không? Đề xuất: **giai đoạn 1 KHÔNG auto-score** — chỉ ghi âm, lưu `SpeakingAttempt`, để giáo viên nghe và chấm tay qua mục B1 bên dưới. Auto pronunciation-scoring (tô màu từng từ đúng/sai) để giai đoạn 2, vì cần tích hợp bên thứ 3 và ảnh hưởng lớn tới độ phức tạp/chi phí.
- **Test case**:
  1. Ghi <1s → nút xác nhận disable + "Ghi âm quá ngắn".
  2. Ghi quá 60s → tự dừng, không crash.
  3. Từ chối quyền mic → hiện hướng dẫn cấp quyền, không crash trắng màn hình.
  4. Nghe "giọng mẫu"/"giọng của em" đúng file của câu đang làm, không lẫn audio câu trước.

### A5. Challenges — mở lại bài đã nộp
- Tap card `DONE`/`PENDING` → mở màn Chi tiết: từng câu hỏi, đáp án học sinh chọn, đáp án đúng, điểm từng câu, nhận xét giáo viên (text/audio nếu có).
- `PENDING` → chỉ hiện "Đang chờ giáo viên chấm", tuyệt đối không lộ điểm/badge DONE giả trước khi giáo viên xác nhận.
- **Test case**: bài DONE mở đúng nội dung của chính bài đó, không lẫn dữ liệu bài khác; bài PENDING không hiện điểm.

### A6–A9: Toast / phản hồi nút / responsive desktop / đồng nhất ngôn ngữ
Áp dụng nguyên tắc chung ở §0 cho toast và trạng thái nút — không viết lại. Còn 2 việc riêng:
- **A8 Responsive**: <768px giữ layout hiện tại; ≥768px thêm sidebar trái (menu nhanh) + panel phải (mini leaderboard/streak), giữ max-width nội dung chính để không vỡ line-length. Test: 768/1024/1280/1920px không còn khoảng trắng lãng phí quá ~15% chiều ngang.
- **A9 Ngôn ngữ**: bảng đối chiếu tối thiểu — `CHECK→Kiểm tra, CONTINUE→Tiếp tục, FINISH→Hoàn thành, "Select the correct answer"→"Chọn đáp án đúng", "Fill in the blank"→"Điền vào chỗ trống", "Match the pairs"→"Ghép cặp"`. Nội dung câu hỏi/đáp án tiếng Anh giữ nguyên (đó là mục đích học). Test: quét toàn bộ chuỗi hiển thị trong luồng practice, không còn label khung nào bằng tiếng Anh.

---

## 3. Đặc tả tính năng — App Giáo viên

### B1. Chấm bài — hiện nội dung bài làm thật trước khi chấm
- Click dòng học sinh → accordion mở rộng: câu hỏi gốc, câu trả lời thật (text hoặc audio player nếu bài nói), ô điểm tay, nút ghi âm nhận xét, ô nhận xét text.
- **Nút "Tự chấm"**: CHỈ hiển thị cho câu có đáp án chuẩn cố định (trắc nghiệm/điền từ). Với bài tự luận/nói, đổi thành **"Gợi ý điểm (AI)"** — set `graded_by:"auto", is_confirmed_by_teacher:false` — điểm CHƯA tính vào CEFR cho tới khi giáo viên bấm "Lưu điểm" xác nhận (`is_confirmed_by_teacher:true`). Đây là fix trực tiếp cho lỗi thực tế đã gặp: "Tự chấm" ra thẳng 100/100 không qua ai duyệt.
- **Nút 🎙 ghi nhận xét giọng nói**: ghi âm (cùng pattern component với A4) → lưu `Grade.comment_audio_url`.
- **Nút "Lưu điểm"**: disable nếu ô điểm rỗng; lưu xong mới cập nhật CEFR theo công thức đã chốt ở §1, và tạo `Notification` cho phụ huynh (khi portal đó tồn tại).
- **Test case**: chấm 1 bài tự luận → điểm không tự thành 100 khi chưa ai xác nhận; test lại luôn case cũ ở A5 (điểm hiện đúng ở Challenges học sinh sau khi giáo viên Lưu điểm).

### B2. Roster — tách nhãn "Cần hỗ trợ"
- Logic tag (không mập mờ như hiện tại): `điểm < 40` → tag đỏ "Điểm yếu"; `streak_days == 0 hôm nay` → tag cam "Mất streak". Có thể hiện cả 2 nếu đúng cả 2 điều kiện, KHÔNG gộp chung 1 tag "Cần hỗ trợ" như hiện tại.
- **Test case**: học sinh điểm cao nhưng chỉ mất streak (trường hợp thực tế đã gặp: An 70.7 điểm) → chỉ hiện tag cam, không hiện tag đỏ.

### B3. "Chi tiết →" dẫn tới Portfolio
- Route `/teacher/{id}/portfolio/{student_id}`, liệt kê `JournalEntry + SpeakingAttempt + Grade` theo thời gian giảm dần, mỗi entry có control duyệt/từ chối + sao chấm nhanh (định nghĩa chi tiết ở B5).

### B4. Bảng tin — thêm bước Preview trước khi đăng
- Nút "Đăng thông báo" lần 1 KHÔNG post ngay — chuyển sang bước Preview (hiện đúng như học sinh sẽ thấy) với 2 nút "Sửa lại"/"Xác nhận đăng". Chỉ "Xác nhận đăng" mới thật sự `POST`.
- Announcement đã đăng: thêm icon sửa (giữ timestamp gốc, đánh dấu "đã chỉnh sửa") + icon xoá (có confirm dialog).
- **Test case**: gõ nội dung có lỗi chính tả → phát hiện được ở bước Preview, chưa public — đây là fix trực tiếp cho lỗi nội dung thô ẩu đã thấy trong data mẫu.

### B5. Portfolio (mục mới, sidebar nhóm "Hoạt động")
- Lưới theo cột/học sinh, mỗi card: preview nội dung, ngày, badge trạng thái (`pending_review/approved/rejected`), thang sao.
- **Nút Duyệt/Từ chối**: `Duyệt` → `JournalEntry.status = approved, approved_at = now` → chỉ khi `approved` mới được hiện cho phụ huynh xem sau này (khi portal đó dựng xong) hoặc hiện công khai trong lớp (nếu có tính năng đó).
- **Sao chấm nhanh**: tap sao thứ N → set `star_rating = N` ngay lập tức, sửa lại được bất cứ lúc nào, không cần nút Lưu riêng.

### B6. Tổng quan — tooltip định nghĩa chỉ số
- Icon ⓘ cạnh "Điểm trung bình": "Trung bình cộng điểm bài kiểm tra đã chấm của học sinh có ít nhất 1 bài kiểm tra."
- Icon ⓘ cạnh "Cần chú ý": "Học sinh có streak = 0 ngày HOẶC điểm trung bình < 40/100" — phải khớp đúng 100% với logic thật đang chạy, không phải câu mô tả ước lượng.

---

## 4. Liên kết chéo giữa các tính năng (dependency map)

Đây là phần quan trọng để tránh build rời rạc từng cái riêng lẻ:

1. `JournalEntry` (A3) → xuất hiện trong Teacher Portfolio (B5) → giáo viên Duyệt (B5) → **[CẦN CHỐT]** có cộng điểm/XP gì cho học sinh khi bài được duyệt không, hay chỉ mang tính ghi nhận? → nếu có, phải cùng công thức CEFR ở §1 → khi Parent portal tồn tại, tạo `Notification` cho phụ huynh.
2. `SpeakingAttempt` (A4) → nếu giáo viên đánh dấu bài "cần chấm tay" → xuất hiện trong Chấm bài (B1) → giáo viên chấm bằng voice comment → ghi vào `Grade` → cộng vào CEFR theo công thức đã chốt.
3. `VocabReviewLog` (A1b) → quyết định số "Vocab learned" hiển thị ở Profile. **[CẦN CHỐT]** định nghĩa "đã học": đề xuất 1 từ tính "learned" khi `remembered` liên tiếp ≥2 lần theo SM-2 — cần PM xác nhận ngưỡng này có đúng ý sản phẩm không.
4. Component Toast (§0) và State-machine nút (§0) dùng lại cho MỌI tính năng A1–B6 phía trên — không viết logic riêng lẻ từng chỗ, tránh lặp lại đúng lỗi "double-click" và "toast kẹt màn hình" đã lan khắp app do mỗi chỗ tự implement 1 kiểu.
5. Số điểm CEFR hiển thị ở Learn (học sinh), Profile (học sinh), Roster (giáo viên), Chi tiết học sinh (giáo viên) — **bắt buộc đọc từ cùng 1 API/1 nguồn tính toán**, không để mỗi màn tự tính hoặc cache riêng — đây chính là nguyên nhân đã ghi nhận: đổi điểm ở tab Giáo viên không tự cập nhật ở tab Học sinh đang mở sẵn.

---

## 5. Vòng test lặp lại (không phải code xong là xong)

- Test case ở mỗi mục A1–B6 là **checklist bắt buộc**, không phải gợi ý optional.
- Sau khi merge 1 tính năng, **chạy lại toàn bộ test case của các tính năng liên quan trong bảng dependency map ở §4** (regression) — không chỉ test tính năng mới, vì thực tế đã thấy 1 lỗi nhỏ (double-click) lan ra toàn bộ app do nhiều chỗ dùng chung 1 pattern lỗi.
- **Điều kiện tối thiểu để coi 1 tính năng là "Done"**:
  1. Happy path đúng như spec.
  2. Dữ liệu còn nguyên sau khi F5 (persist thật, không phải optimistic giả).
  3. Mất mạng/API lỗi giữa chừng không làm mất input người dùng đã nhập.
  4. Không còn toast/nút bị kẹt trạng thái loading vĩnh viễn.
  5. Chạy đúng ở cả breakpoint mobile (~375px) và desktop (~1440px).
  6. Nếu tính năng có xuất hiện ở nhiều màn (VD điểm CEFR) → số liệu khớp nhau tuyệt đối giữa các màn, test bằng cách mở 2 tab cùng lúc như cách demo app tự quảng cáo.

---

## 6. Danh sách [CẦN CHỐT] tổng hợp (PM/Founder quyết định trước khi giao dev)

1. Công thức CEFR % duy nhất, dùng chung mọi nơi (§1).
2. Giai đoạn 1 của Luyện nói có auto pronunciation-scoring hay chỉ ghi âm cho giáo viên nghe chấm tay (§A4).
3. Bài được duyệt trong Portfolio có cộng điểm/XP cho học sinh không (§4, mục 1).
4. Ngưỡng định nghĩa "Vocab learned" (§4, mục 3).
