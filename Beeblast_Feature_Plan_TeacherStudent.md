# Beeblast — Đề xuất tính năng (App Giáo viên & Học sinh)

Tổng hợp ý tưởng từ 2 nguồn tham khảo, đối chiếu với hiện trạng Beeblast (đã QA thực tế), lọc ra phần khả thi để build. Phần Phụ huynh để sau — portal này hiện đang 404 hoàn toàn nên chưa có gì để mở rộng lên trên.

## Nguồn tham khảo

- **RubeeShine** (app luyện tiếng Anh cá nhân): mạnh về Visual Learning (ảnh+âm thanh gắn với từ vựng), Grammar theo hội thoại tình huống, Speaking chấm lỗi phát âm từng từ + nghe lại so sánh giọng mẫu, Fluency theo chủ đề thực chiến.
- **Workflow Padlet của một giáo viên trên Threads**: portfolio bài nộp theo cột/học sinh, duyệt bài trước khi công khai (chống chép bài), chấm bằng voice comment, chấm sao nhanh, xuất video tổng kết cuối khóa cho phụ huynh.

## App Học sinh

1. **Flashcard từ vựng có nghĩa/ảnh/audio** — Vault hiện tại: bấm vào từ không hiện gì cả (lỗi đã ghi nhận). Thêm nghĩa tiếng Việt + ảnh minh họa + audio phát âm khi tap, dùng cho nút "Flashcard Review" đã có sẵn nhưng chưa rõ có hoạt động thật hay không.
2. **Luyện nói (Speaking) — tính năng hoàn toàn mới**. Hiện Beeblast chỉ có trắc nghiệm/điền từ/ghép cặp dạng chữ, không có phần nói. Thêm bài ghi âm theo câu cuối mỗi Lesson, cho nghe lại giọng mình so với giọng mẫu; chấm lỗi phát âm có thể làm thủ công qua giáo viên trước (xem mục Teacher), tự động hoá sau.
3. **Nhật ký nộp bài / portfolio cá nhân** — sửa và nâng cấp ô "Write a few sentences" đang không bấm được: cho viết HOẶC ghi âm ngắn sau mỗi Unit, lưu lại thành dòng thời gian trong Profile để học sinh xem lại bài cũ, giáo viên xem lại để chấm.
4. **Ngữ pháp theo hội thoại mô phỏng** — 2 rule "Present Simple", "Wh-questions" trong Vault hiện chỉ là thẻ tĩnh. Chuyển thành bài tập tình huống (chọn câu trả lời tự nhiên trong hội thoại) kèm cảnh báo lỗi hay gặp, thay vì học công thức khô.
5. **Mở rộng chủ đề thực chiến trong Arena** — Arena đã có "Travel & Airport", "Workplace & Email"; bổ sung cụm từ cố định theo chủ đề + bài đọc hiểu điền từ theo mạch văn.

## App Giáo viên

1. **Portfolio học sinh theo dòng thời gian** — mỗi học sinh có 1 "cột" gom mọi bài nộp (viết + ghi âm nói) theo tuần/Unit, xem nhanh lịch sử học của từng em thay vì rải rác trong Chấm bài / Bảng tin.
2. **Duyệt bài trước khi công khai** — bài viết/ghi âm của học sinh cần giáo viên duyệt mới hiện cho cả lớp thấy, tránh học sinh chép ý nhau (áp dụng cho tính năng nhật ký ở trên).
3. **Chấm bằng voice comment** — trong Chấm bài, thêm nút ghi âm nhận xét trực tiếp (đặc biệt hữu ích khi có bài nói), nhanh hơn gõ chữ khi cần sửa phát âm/ngữ điệu.
4. **Chấm sao nhanh cho bài nộp lẻ** — tách biệt với hệ "Tuyên dương" (khen thành tích dài hạn) đã có sẵn; cho phép 1-5 sao nhanh mỗi bài nộp nhỏ mà không cần mở form đầy đủ.
5. **Xuất "Hành trình tiến bộ" cuối kỳ** *(ưu tiên thấp, làm sau khi có portfolio)* — gom các bài ghi âm/viết của 1 học sinh theo thời gian thành 1 trang/clip tổng hợp để khoe phụ huynh — đây là tính năng tạo cảm xúc, hỗ trợ giữ chân phụ huynh trả phí, nhưng phụ thuộc portal Phụ huynh phải tồn tại trước.

## Thứ tự triển khai đề xuất

**Giai đoạn 1 — vá chỗ đang chết + giá trị nhanh**
Flashcard có nghĩa/audio trong Vault · Fix "Write a few sentences" thành nhật ký viết được · Voice comment khi chấm bài.

**Giai đoạn 2 — tính năng mới cần đầu tư**
Luyện nói ghi âm + nghe lại so sánh · Portfolio theo dòng thời gian + cơ chế duyệt bài.

**Giai đoạn 3 — differentiator, làm sau khi nền ổn định**
Grammar theo hội thoại mô phỏng · Mở rộng chủ đề thực chiến Arena · Xuất video tổng kết cuối kỳ (gắn với việc dựng lại portal Phụ huynh).

Chủ đề/nội dung giáo trình chi tiết (Chương trình, Thư viện học liệu) chưa đụng tới theo yêu cầu — để dành khi anh upload xong giáo trình.
