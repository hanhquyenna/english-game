# Beeblast — FRS bổ sung: Đa dạng định dạng bài nộp & phần còn thiếu từ RubeeShine v1

Bổ sung cho FRS v2 + Lesson Hub v1. Trả lời 2 việc: (1) "Homework" thực tế có nhiều dạng bài nộp, phải làm đối xứng cả bên Học sinh (nộp) lẫn Giáo viên (nhận đúng dạng đó) — Padlet workflow đã gửi trước đó chính là ví dụ (video, ảnh, audio, text đều nộp được, giáo viên xem/chấm đúng định dạng tương ứng); (2) rà lại RubeeShine xem còn phần nào chưa đưa vào FRS.

---

## 1. Đa dạng định dạng bài nộp — đối xứng Học sinh ⇄ Giáo viên

### 1.1 Data model

Gộp `JournalEntry` (FRS v2 §1) và phần nộp bài trong `LessonContent type: homework` (Lesson Hub v1 §2) vào chung 1 entity, vì bản chất đều là "bài học sinh nộp" — tách riêng trước đây dễ sinh ra 2 nơi code khác nhau cho cùng 1 việc:

| Entity | Field chính | Ghi chú |
|---|---|---|
| `Submission` (thay cho `JournalEntry`) | `id, student_id, source_type: journal\|homework\|speaking, source_ref_id (unit_id/lesson_id/assignment_id), type: text\|audio\|image\|video\|file, content (text, nullable), media_url, media_mime_type, file_size_bytes, duration_seconds (audio/video), status: draft\|submitted\|approved\|rejected, star_rating, created_at` | 1 bảng, nhiều nguồn, nhiều định dạng |
| `AssignmentConfig` | `lesson_content_id hoặc homework_id, allowed_types: string[]` (VD `["audio"]` cho bài luyện nói, `["image","file"]` cho bài "chụp vở bài tập") | giáo viên/admin cấu hình khi soạn bài, quyết định học sinh được nộp bằng cách nào |
| `Grade` (mở rộng theo FRS v2) | thêm `comment_type: text\|audio\|image` | để giáo viên cũng chấm bằng nhiều dạng, không chỉ text/audio như v2 đã nêu |

### 1.2 Phía Học sinh — nộp bài theo đúng loại được phép

- Màn nộp bài đọc `AssignmentConfig.allowed_types` của bài đó, chỉ hiện đúng các nút tương ứng — không hiện tất cả 5 loại tràn lan nếu bài đó chỉ cho phép 1-2 loại (VD bài luyện nói chỉ hiện nút ghi âm, không hiện nút tải ảnh).
- **Viết (text)**: textarea, như đã đặc tả ở FRS v2 §A3.
- **Ghi âm (audio)**: như FRS v2 §A4, tối đa 60s cho bài luyện nói / tối đa 5 phút cho bài nói dài hơn (tuỳ `AssignmentConfig`, không hardcode 1 mức chung).
- **Chụp ảnh (image)**: mở camera hoặc chọn từ thư viện ảnh máy → preview trước khi gửi → giới hạn 10MB, resize tự động nếu ảnh gốc lớn hơn (nén phía client trước khi upload, tránh học sinh dùng 4G/mạng chậm bị treo).
- **Quay video (video)**: quay trực tiếp hoặc chọn file có sẵn → giới hạn thời lượng 2 phút / dung lượng 50MB (phù hợp học sinh dùng mobile data), preview trước khi gửi.
- **Tải file (file: PDF/doc)**: dùng cho bài cần nộp file đã làm sẵn (ít gặp ở học sinh nhỏ tuổi nhưng cần có cho lớp lớn hơn) — giới hạn 20MB.
- Mọi loại đều theo chung state machine: `Chọn loại → Chuẩn bị nội dung (preview) → Gửi → Submitted`, nút Gửi disable nếu chưa có nội dung, theo đúng nguyên tắc "không optimistic-fake-success" ở FRS v2 §0.
- **Edge case chung cho file lớn**: nếu vượt giới hạn dung lượng → chặn ngay lúc chọn file, báo rõ giới hạn, không để upload thất bại giữa chừng mới báo lỗi.

### 1.3 Phía Giáo viên — component xem bài chung, đối xứng với mọi loại

- Tạo 1 component dùng chung duy nhất `SubmissionViewer({type, media_url})`, dùng lại ở CẢ Chấm bài (FRS v2 §B1) LẪN Portfolio (§B3/B5) — không viết riêng từng chỗ, tránh tình trạng "học sinh nộp được nhưng giáo viên không có chỗ xem" nếu 2 team code 2 màn khác nhau không đồng bộ.
- Logic hiển thị theo `type`:
  - `text` → hiện nguyên văn.
  - `audio` → audio player có nút play/pause, tua được.
  - `image` → ảnh thu nhỏ trong danh sách, tap để phóng to toàn màn hình (lightbox).
  - `video` → video player inline, có thể play trực tiếp không cần tải về.
  - `file` → nếu là PDF thì nhúng viewer xem trực tiếp trong app; nếu định dạng không xem trực tiếp được (doc/docx...) → nút "Tải xuống để xem", không để giáo viên bó tay không mở được file học sinh gửi.
- Giáo viên chấm bằng: điểm số + nhận xét, nhận xét cũng chọn được loại (`Grade.comment_type`: gõ chữ, ghi âm, hoặc chụp ảnh bài đã chấm tay lên giấy rồi gửi lại — đúng ý tưởng đã thấy ở Padlet).
- **Test case**:
  1. Học sinh nộp ảnh → giáo viên mở đúng, phóng to xem rõ được, không bị vỡ/mờ do nén quá tay ở bước 1.2.
  2. Học sinh nộp video → giáo viên phát được ngay trong app, không phải tải file về máy mới xem.
  3. Bài chỉ cho phép nộp audio (theo `AssignmentConfig`) → màn nộp bài học sinh KHÔNG hiện nút ảnh/video/file — chặn ngay từ đầu, không để nộp sai định dạng rồi giáo viên không biết mở thế nào.
  4. Giáo viên chấm bằng ảnh chụp tay → học sinh mở Challenges (FRS v2 §A5) thấy đúng ảnh giáo viên đã gửi, không phải chỉ chữ.

---

## 2. Bổ sung từ RubeeShine — phần chưa đưa vào bản trước

Rà lại 4 nhóm tính năng RubeeShine, phần đã đưa vào FRS trước (flashcard §A1/A1b, luyện nói §A4) giữ nguyên. Còn thiếu 3 việc sau:

### 2.1 Visual Learning — thiếu ẢNH minh hoạ, mới chỉ có nghĩa + audio
`VocabItem` ở FRS v2 §1 đang thiếu field ảnh — mà "liên kết trực tiếp Âm thanh - Hình ảnh" (không dịch qua tiếng Việt) chính là giá trị cốt lõi RubeeShine quảng cáo, chưa có trong spec Vault.
- Thêm field `VocabItem.image_url`.
- Modal từ vựng (§A1) hiện thêm ảnh minh hoạ phía trên nghĩa tiếng Việt.
- **Chế độ Flashcard "chỉ hình + âm thanh"** (tuỳ chọn trong Ôn tập Flashcard §A1b): mặt trước CHỈ hiện ảnh + tự phát audio, KHÔNG hiện chữ tiếng Anh lẫn tiếng Việt — buộc học sinh liên kết trực tiếp hình-âm thay vì dịch. Có nút chuyển giữa chế độ này và chế độ có chữ (dành cho học sinh mới bắt đầu chưa quen).
- **Test**: mặt trước chế độ chỉ-hình không lộ chữ nào; lật thẻ sang mặt sau mới hiện đủ chữ+nghĩa như bình thường.

### 2.2 Ngữ pháp theo hội thoại — chưa có exercise type, mới nằm trong Vault dạng thẻ tĩnh
RubeeShine dạy ngữ pháp qua tình huống hội thoại thay vì học công thức, có bước "mô phỏng hội thoại" và "sửa lỗi sai phổ biến" ngay khi nói/viết sai.
- Thêm exercise type mới `grammar_dialogue` (cạnh `speaking` đã thêm ở FRS v2 §A4): hiện 1 đoạn hội thoại ngắn có chỗ trống, học sinh chọn câu trả lời tự nhiên nhất trong 3-4 lựa chọn (không phải chọn đúng ngữ pháp khô cứng mà chọn câu tự nhiên trong ngữ cảnh).
- Khi chọn sai → hiện ngay lỗi sai phổ biến tương ứng bằng 1 dòng giải thích ngắn (VD: "Lỗi hay gặp: dùng 'do' thay vì 'does' với chủ ngữ số ít"), không chỉ báo đỏ/xanh như các dạng bài khác.
- `GrammarRule` (FRS v2 §1) giữ nguyên cấu trúc, nhưng field `example_dialogue[]` giờ được DÙNG THẬT làm nguồn nội dung cho exercise type này, không chỉ hiển thị tĩnh trong Vault nữa.
- **Test**: chọn câu sai → hiện đúng lời giải thích lỗi phổ biến gắn với `GrammarRule` đang học, không phải thông báo lỗi chung chung.

### 2.3 Arena — chủ đề thực chiến còn thiếu cụm từ cố định + đọc hiểu điền từ theo mạch văn
Arena đã có khung chủ đề ("Travel & Airport", "Workplace & Email") nhưng nội dung bên trong vẫn dùng lại các exercise type cũ (chọn đáp án/điền từ đơn lẻ), chưa có 2 dạng RubeeShine nhấn mạnh cho "Contextual Fluency":
- **Cụm từ cố định (collocations)**: thêm 1 dạng bài trong Arena — cho 1 tình huống thực tế (VD tại sân bay), học sinh chọn đúng cụm từ tự nhiên hay dùng trong tình huống đó thay vì dịch từng từ (VD "check in" chứ không phải "đăng ký vào").
- **Đọc hiểu điền từ theo mạch văn (cloze reading)**: 1 đoạn văn ngắn theo chủ đề, có 3-5 chỗ trống, học sinh điền từ dựa vào mạch văn toàn đoạn (không phải câu đơn lẻ như dạng "Fill in the blank" hiện có) — rèn đọc hiểu logic thay vì đoán từng câu.
- 2 dạng này gắn với `LibraryTopic` (đơn vị nội dung trong Arena, chưa có tên chính thức trong spec trước — đề xuất entity `ArenaTopic{id, title, level_range, unlock_threshold}` chứa các bài theo 2 dạng trên).
- **Test**: đọc hiểu điền từ chấm đúng/sai theo TOÀN đoạn văn (1 từ điền sai không làm toàn bài fail, chấm riêng từng chỗ trống); cụm từ cố định phải có ít nhất 1 lựa chọn gây nhiễu là bản dịch từng từ sai (kiểu "make a check" thay vì "check in") để đúng mục đích rèn phản xạ, không phải may rủi.

---

## 3. Cập nhật dependency map

7. `Submission` (mục 1) là bảng DUY NHẤT chứa bài nộp bất kể nguồn (nhật ký/homework/luyện nói) — `SubmissionViewer` dùng lại y hệt ở Chấm bài, Portfolio, và cả màn xem lại bài cũ của học sinh (FRS v2 §A5). Không tạo thêm bảng/viewer riêng cho từng loại bài nộp mới về sau.
8. `AssignmentConfig.allowed_types` quyết định UI nộp bài hiện nút nào — đây là nguồn cấu hình DUY NHẤT, không hardcode danh sách loại nộp bài riêng ở từng màn.
