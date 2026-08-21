# Beeblast — FRS bổ sung: Lesson Hub & Thanh Homework kiểu Mana v1

Bổ sung cho FRS v2. Test thực tế trên localhost xác nhận: bấm Lesson hiện nhảy thẳng vào exercise, không có màn trung gian; Challenges/Homework vẫn liệt kê theo Unit chứ chưa theo từng Lesson. Tài liệu này đặc tả 2 thay đổi lớn đó, dùng chung nguyên tắc nền §0 của FRS v2 (state machine nút, toast chuẩn hoá, không optimistic-fake-success).

---

## 1. Data model bổ sung

| Entity | Field chính | Ghi chú |
|---|---|---|
| `LessonContent` | `id, lesson_id, type: reading\|listening\|homework, title, body_text, file_url, audio_url, order_index` | nội dung từng khối trong 1 Lesson |
| `LessonSectionProgress` | `student_id, lesson_id, content_id, status: not_started\|in_progress\|completed, completed_at` | trạng thái từng khối của từng học sinh — nguồn duy nhất để tính % thanh mana và % trên Learn map |

**Nguyên tắc bắt buộc**: % hoàn thành Lesson (hiện trên Learn map, trong Lesson Hub, và trên thanh Homework ở Challenges) PHẢI tính từ cùng 1 công thức: `completed_sections / total_sections × 100`, đọc từ `LessonSectionProgress`. Không được để 3 nơi tự tính riêng — đây chính là kiểu lỗi lệch số đã gặp ở CEFR% trước đó.

---

## 2. Lesson Hub — màn trung gian khi bấm vào Lesson

### Thay đổi hành vi
- **Hiện tại**: tap node Lesson trên Learn map → vào thẳng exercise.
- **Mới**: tap node Lesson (bất kể trạng thái nào — chưa làm/đang làm/đã xong 100%) → luôn mở **Lesson Hub** trước. Học sinh có thể quay lại Hub bất cứ lúc nào để xem lại tài liệu, không chỉ lúc học lần đầu.

### Layout Hub
- Header: tên Lesson, Unit, % hoàn thành tổng (từ `LessonSectionProgress`).
- Danh sách card theo `LessonContent.order_index`, mỗi loại 1 icon riêng:
  - 📖 **Đọc** (`type: reading`) — có `file_url` (PDF/ảnh) hoặc `body_text`.
  - 🎧 **Nghe** (`type: listening`) — có `audio_url`.
  - 📝 **Bài tập** (`type: homework`) — dẫn vào luồng exercise hiện có (KHÔNG đổi UI luyện tập đang có, chỉ đổi điểm vào).
- Mỗi card hiện badge trạng thái theo `LessonSectionProgress.status`: "Chưa xem" / "Đang học" / "Đã xong ✓".
- Nếu Lesson chưa có content Đọc/Nghe (chỉ có Bài tập) → Hub vẫn hiện, chỉ có 1 card Bài tập, không ẩn hẳn Hub để giữ trải nghiệm nhất quán.
- Nếu content chưa được giáo viên/admin upload cho phần Đọc/Nghe → hiện "Chưa có tài liệu cho phần này" thay vì để trống trắng, để học sinh biết đây là thiếu nội dung chứ không phải lỗi.

### Logic từng nút
- **Card 📖 Đọc**: tap → có `file_url` thì mở viewer, chỉ có `body_text` thì mở trang đọc đơn giản trong app. Cuối trang có nút "Đã đọc xong" → `PATCH LessonSectionProgress{status: completed}`. Đóng giữa chừng → giữ `in_progress`, không tự đánh dấu completed.
- **Card 🎧 Nghe**: tap → mở audio player. Nghe hết file hoặc bấm "Đã nghe xong" → completed.
- **Card 📝 Bài tập**: tap → vào luồng exercise hiện tại (không đổi). Hoàn thành bài → tự động `PATCH LessonSectionProgress{content_id: homework, status: completed}`, quay lại Hub (không quay thẳng về Learn map) để học sinh thấy % Hub vừa tăng.
- **Nút back trên mọi content block**: luôn quay về Hub của Lesson đó, không quay thẳng về Learn map — giữ ngữ cảnh học sinh đang ở Lesson nào.

### Test case
1. Tap Lesson đã hoàn thành 100% trước đó → mở Hub, KHÔNG tự nhảy vào exercise (đổi hành vi so với hiện tại).
2. Tap từng loại card → mở đúng loại view tương ứng (đọc/nghe/bài tập).
3. Hoàn thành cả 3 phần → % trên Learn map, trong Hub, và thanh Homework ở Challenges (mục 3) phải khớp nhau tuyệt đối — test bằng cách mở 2 tab song song.
4. Lesson chỉ có Bài tập, không có Đọc/Nghe → Hub vẫn hiện đúng 1 card, không lỗi trắng màn hình.
5. Đóng trang Đọc giữa chừng (chưa bấm "Đã đọc xong") → quay lại Hub, card vẫn ở trạng thái "Đang học", không tự thành "Đã xong".

---

## 3. Vault — liên kết lại với Lesson Hub (để đúng nghĩa "thư viện cá nhân")

Vault hiện tại (đã build) mới chỉ có Vocab + Grammar. Để đúng ý "thư viện những gì đã học", mỗi Unit trong Vault > Materials cần thêm 2 khối nữa, trỏ ngược lại đúng `LessonContent` đã xem trong Lesson Hub:
- **Đã đọc**: liệt kê các `LessonContent type: reading` mà học sinh đã có `status: completed`, tap mở lại y hệt nội dung đã đọc (dùng lại component viewer ở mục 2).
- **Đã nghe**: tương tự cho `listening`.
- Không hiện các content chưa `completed` trong Vault (Vault là kho lưu cái đã học xong, không phải danh sách nhiệm vụ — đó là việc của Lesson Hub/Homework bar).

---

## 4. Challenges > Homework — đổi từ liệt kê theo Unit sang thanh "mana" theo từng Lesson

### Thay đổi hành vi
- **Hiện tại**: 1 card cho cả Unit (VD "Unit 2: Family — 57% complete").
- **Mới**: liệt kê từng Lesson trong Unit đang học, mỗi Lesson = 1 thanh ngang kiểu thanh máu/mana:
  - Fill theo % lấy từ `LessonSectionProgress` (đúng công thức chung ở mục 1).
  - Màu theo ngưỡng cố định (không dùng gradient liên tục, để nhìn lướt qua là biết ngay): `0–99% → đỏ`, `100% → xanh lá`.
  - Label trên thanh: "Lesson 9 — 67%".

### Logic
- Thanh là **link điều hướng** tới đúng Lesson Hub của Lesson đó (dùng route link, không dùng `onClick` JS thuần — tránh lặp lại lỗi double-click đã gặp khắp app do nhiều nơi tự viết handler riêng).
- Trong Lesson Hub mở ra từ đây, card nào còn thiếu (`status != completed`) tự động lên đầu danh sách + badge "Chưa làm" nổi bật, để học sinh thấy ngay phần còn thiếu thay vì phải tự dò.
- Lesson đã 100% vẫn bấm được (để xem lại), nhưng không cộng thêm % gì khi mở lại (tránh hiểu nhầm giống lỗi "làm lại bài cũ tăng % ảo" đã gặp ở CEFR — 2 vấn đề tách biệt, tính bằng 2 cơ chế khác nhau nên không đá nhau, nhưng cần dev lưu ý khi code).

### Test case
1. Lesson có 2/3 section xong (Đọc ✓, Nghe ✓, Bài tập chưa) → thanh hiện 67%, màu đỏ.
2. Lesson đủ 3/3 → thanh 100%, màu xanh.
3. Bấm vào thanh 67% → mở đúng Lesson Hub của Lesson đó, card "Bài tập" (phần còn thiếu) hiện đầu danh sách kèm badge "Chưa làm".
4. % trên thanh phải khớp 100% với % hiện trên Learn map và trong Hub của cùng 1 Lesson (test 2 tab song song).
5. Bấm lại Lesson đã 100% → mở Hub xem lại được, nhưng không có gì thay đổi ở XP/CEFR chỉ vì mở lại xem (phân biệt với hành vi "làm lại bài tập" ở mục 2, vốn có giới hạn XP riêng theo FRS v2 mục 6.1).

---

## 5. Cập nhật dependency map (nối vào FRS v2 mục 4)

6. `LessonContent` + `LessonSectionProgress` là nguồn DUY NHẤT cho: % trên Learn map, % trong Lesson Hub, % trên thanh Homework ở Challenges, và danh sách "Đã đọc/Đã nghe" trong Vault. Bốn nơi hiển thị, một nguồn tính — không cache/tính riêng lẻ ở bất kỳ màn nào trong số đó.
