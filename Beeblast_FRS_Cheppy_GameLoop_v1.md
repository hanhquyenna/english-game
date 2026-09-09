# Beeblast — FRS Cheppy-inspired Game Loop v1 (bản chốt để giao Antigravity)

Nguồn: teardown thực tế app Cheppy.ai (đối thủ, mạnh về R&D) ngày 15/8/2026 — đi hết School/Mission/Practice/Playground/Leaderboard. Tài liệu này KHÔNG copy nguyên xi UI của Cheppy — đã đối chiếu với source code Beeblast hiện tại (`/Users/ad/Documents/Beeblast/src`, `supabase/migrations`) để tái dùng tối đa hạ tầng đã có, chỉ thêm phần Beeblast còn thiếu, và né đúng 2 lỗi đã thấy tận mắt bên Cheppy (mục 0.3).

## 0.1 Đã có sẵn ở Beeblast — TÁI DÙNG, không xây lại

- `islands` / `IslandBand` ở trang Learn (`app/student/[studentId]/page.tsx`) đã CHÍNH LÀ bản "Mission map" kiểu Cheppy (path uốn lượn qua các đảo) — không cần xây thêm map thứ 2.
- `rank/page.tsx` đã CHÍNH LÀ Leaderboard (podium + tab Total stars / Day streak) — mục C4 dưới đây chỉ thêm 1 tab, không xây lại trang.
- `practice/[topicId]/page.tsx` đã tồn tại nhưng **`practice/page.tsx` (trang chủ của mục Practice) chưa có** — đúng khoảng trống mà mục C2 lấp vào.
- Vault (`vault-review-client.tsx`) đã là spaced-repetition review — không đụng vào, chỉ tham chiếu logic SM-2 rút gọn sẵn có.
- `gems` (int, trên `users`), `xp_ledger`, `streak_count`, mascot ong 🐝 ("Cấp X — Ong Chăm Chỉ") đã có — MỌI reward mới trong tài liệu này cộng qua `xp_ledger` / cột `gems` sẵn có, không tạo hệ currency song song.

## 0.2 Thật sự mới — Cheppy có, Beeblast chưa có gì tương đương

C1 AI Role Play (luyện nói theo nhiệm vụ với AI) · C2 Ôn luyện chủ động (Mistake Review + Skill Boost, gắn 7 kỹ năng) · C3 Thư viện Truyện tương tác (đọc có audio đồng bộ từng chữ) · C4 Bảng xếp hạng theo Tier/League (mở rộng tab ở `rank`) · C5 Thú cưng đồng hành (Buddy Pet) gắn với streak.

## 0.3 Né đúng 2 lỗi đã thấy ở Cheppy khi build

1. Cheppy có tính năng "My Buddy" bấm vào là **loading vô hạn, không bao giờ xong**, treo app thật (đã tự kiểm chứng nhiều phút, qua cả restart). → C5 bắt buộc: màn Buddy Pet phải render state rỗng/skeleton NGAY, dữ liệu fetch xong mới thay, có timeout 8s → hiện lỗi + nút "Thử lại", **cấm** 1 màn hình chỉ có spinner không có lối thoát.
2. Cheppy có 2 ô "Phonics" và "Talk Card" bấm vào chỉ ra "Coming Soon" — trải nghiệm cụt. → Toàn bộ entry point trong tài liệu này chỉ hiện khi tính năng chạy thật; nếu 1 phase chưa xong, ẩn hẳn entry point đó khỏi UI (feature flag), không hiện rồi bấm vào cụt.

---

## 1. Data model (bổ sung — không sửa bảng cũ trừ khi ghi rõ)

| Bảng mới | Field chính | Ghi chú |
|---|---|---|
| `exercises` (ALTER) | + `skill_tag: nghe\|noi\|doc\|viet\|tu_vung\|ngu_phap\|phat_am` | cần có để tính sao mastery C2; nếu cột đã tồn tại dưới tên khác thì đổi tên cho khớp, không tạo cột trùng |
| `practice_sessions` | `id, student_id, mode: mistake_review\|skill_boost, skill_tags text[], question_count, estimated_minutes, reward_gems, reward_xp, created_at, completed_at` | tạo khi bấm "Bắt đầu" ở C2, không tạo khi mới xem preview |
| `practice_session_items` | `session_id, exercise_id, order, resolved bool` | nguồn câu hỏi: với `mistake_review` = các `exercise_attempts.is_correct=false` chưa `resolved`; với `skill_boost` = random theo `skill_tags` đã chọn |
| `role_play_topics` | `id, title_vi, icon, cefr_band, is_active bool` | 3 topic khởi điểm: House Tour / My Classroom / My Lunch — giữ đúng tên để so sánh A/B với Cheppy sau này |
| `role_play_tasks` | `id, topic_id, order, prompt_vi, keyword_hints text[]` | mỗi topic đúng 3 task, giống pattern Cheppy |
| `role_play_sessions` | `id, student_id, topic_id, status: in_progress\|completed\|abandoned, started_at, completed_at, reward_gems, reward_xp` | |
| `role_play_utterances` | `id, session_id, task_id nullable, audio_url, transcript, created_at` | transcript từ STT, KHÔNG chấm điểm phát âm (xem 4.1) |
| `role_play_task_completions` | `session_id, task_id, completed_at, matched_keyword` | ghi khi transcript khớp `keyword_hints` — xem 4.1 để không phạm quy tắc 6.2 của FRS v2 |
| `stories` | `id, title, cover_url, genre, difficulty: easy\|hard, cefr_band, topic_tag` | |
| `story_pages` | `id, story_id, order, illustration_url, text_en, audio_url, word_timings jsonb` | `word_timings`: mảng `{word, start_ms, end_ms}` để highlight đồng bộ như đã thấy ở Cheppy |
| `story_reads` | `id, student_id, story_id, page_id, read_at, reward_claimed bool` | 1 trang chỉ thưởng gems 1 lần/ngày/học sinh — xem 4.2 |
| `league_groups` | `id, week_start_date, cefr_band, group_index` | mỗi tuần tạo lại, chia học sinh cùng band thành nhóm ~30 |
| `league_memberships` | `league_group_id, student_id, xp_this_week, joined_at` | |
| `pet_species` | `id, name, stage_thresholds jsonb` | vd `[{stage:1,min_streak:0},{stage:2,min_streak:7},{stage:3,min_streak:21}]` |
| `student_pets` | `id, student_id, species_id, stage int, happiness int, last_fed_at, created_at` | mỗi học sinh 1 pet mặc định, đổi loài qua Shop (giai đoạn sau) |

---

## 2. Đặc tả tính năng

### C1. AI Role Play — luyện nói theo nhiệm vụ
Route: `student/[studentId]/roleplay` (mới) → `roleplay/[topicId]` (phòng hội thoại).

- **Chọn topic**: lưới thẻ (House Tour / My Classroom / My Lunch + 1 thẻ "Ngẫu nhiên" random topic còn lại) — dùng `Tile` sẵn có, không thẻ mới style riêng.
- **Role card trước khi vào** (giống pattern Cheppy, giống hệt cách Practice C2 hiện chi phí trước): "Em là: Học sinh — AI: [tên mascot]", 1 dòng nhiệm vụ, "Phần thưởng: +N gems". Nút "Bắt đầu" mới tạo `role_play_sessions`.
- **Trong phòng hội thoại**: checklist 3 nhiệm vụ luôn hiện (không phải chat trống) — vd "Nói 1 đồ vật trong lớp", "Nói em dùng nó để làm gì", "Nói nó ở đâu trong lớp". Nút mic tròn (tap ghi/tap dừng, tối đa 60s — tái dùng đúng UX ghi âm đã có ở A4 luyện nói). Có toggle "Phụ đề" (hiện transcript) và nút gợi ý (💡, hiện 1 câu mẫu tiếng Anh ngắn).
- **Hoàn thành task**: sau mỗi lượt ghi âm, STT ra `transcript`, so khớp case-insensitive với `keyword_hints` của từng task chưa hoàn thành → khớp thì tick task đó, ghi `role_play_task_completions`. Đủ 3/3 task → `role_play_sessions.status = completed`, cộng `reward_gems`/`reward_xp` qua `xp_ledger` (nguồn `source = roleplay_completed`), hiện màn chúc mừng dùng đúng mascot ong 🐝 sẵn có.
- Thoát giữa chừng → dialog xác nhận (tái dùng dialog "Bạn có chắc muốn thoát?" theo đúng tinh thần Cheppy nhưng bằng bee mascot, không mascot rồng).
- **Test**: (1) nói đúng nội dung 1 task → tick ngay, không cần nói y hệt `keyword_hints`, chỉ cần chứa từ khoá; (2) nói xong cả 3 task theo thứ tự bất kỳ (không bắt buộc tuần tự) → vẫn hoàn thành; (3) mất quyền mic → hướng dẫn cấp quyền, không crash; (4) thoát giữa chừng → `status=abandoned`, không cộng thưởng, vào lại topic đó tạo session mới (giữ lịch sử session cũ); (5) offline giữa lúc ghi âm → giữ file local, hiện toast lỗi + nút gửi lại, không mất bản ghi.

### C2. Ôn luyện chủ động — trang chủ mới cho `practice/`
Route: `student/[studentId]/practice` (page.tsx hiện chưa tồn tại — tạo mới, không đụng `practice/[topicId]`).

- 2 thẻ lớn: **"Sửa lỗi sai"** (Mistake Review) và **"Luyện kỹ năng"** (Skill Boost) — dùng đúng `Tile` + `Mono` như các trang khác, không màu ngoài token `st-*`.
- **Sửa lỗi sai**: bấm vào → preview "N câu · ~M phút · Thưởng +X gems +Y XP" TRƯỚC khi bắt đầu (đúng pattern Cheppy, và đúng tinh thần "không optimistic" — chỉ tạo `practice_sessions` khi bấm "Bắt đầu" thật). Nguồn câu hỏi = mọi `exercise_attempts.is_correct=false` của học sinh chưa từng `resolved=true` trong `practice_session_items`, tối đa 15 câu/phiên (ưu tiên câu sai gần nhất). Hết bank lỗi sai → hiện trạng thái rỗng vui vẻ "Chưa có lỗi nào để sửa, học tiếp bài mới nhé!" thay vì màn trắng.
- **Luyện kỹ năng**: màn chọn kỹ năng dạng lưới 7 ô (Nghe/Nói/Phát âm/Từ vựng/Ngữ pháp/Đọc/Viết), mỗi ô hiện `stars = round(5 × accuracy 20 câu gần nhất của skill_tag đó)` — tính real-time từ `exercise_attempts` JOIN `exercises.skill_tag`, KHÔNG lưu số sao cứng (giống nguyên tắc 6.4 của FRS v2 cho "Vocab learned"). Chọn multi-select ≥1 kỹ năng → "Tiếp tục" → preview chi phí/thưởng như trên → "Bắt đầu" tạo phiên trộn câu hỏi từ các `skill_tag` đã chọn.
- Giao diện làm bài bên trong tái dùng nguyên component exercise runner đã có (word-order, matching, v.v. — không viết lại loại bài tập, chỉ đổi nguồn câu hỏi).
- **Test**: (1) học sinh chưa sai câu nào → "Sửa lỗi sai" hiện trạng thái rỗng, không crash; (2) làm đúng lại 1 câu từng sai trong phiên Mistake Review → `resolved=true`, không còn xuất hiện ở phiên sau; (3) chọn 0 kỹ năng ở Skill Boost → nút "Tiếp tục" disable; (4) sao mastery đổi ngay sau khi làm thêm câu đúng/sai (không cần reload); (5) 2 tab mở song song, hoàn thành phiên ở tab 1 → số sao ở tab 2 khớp sau khi F5.

### C3. Thư viện Truyện — đọc tương tác có audio đồng bộ
Route: `student/[studentId]/library` (mới — KHÔNG trùng route `story` bên Teacher, đó là bảng tin lớp, khác hoàn toàn).

- Kệ sách lưới ảnh bìa, filter Dễ/Khó + Chủ đề (dùng lại `Segmented`/filter chip pattern sẵn có).
- Trang đọc: ảnh minh hoạ to + text bên dưới, chữ đang đọc **highlight màu `st-accent`** theo `word_timings`, nút loa phát lại cả trang, nút lật trang trái/phải.
- Mỗi trang đọc xong (audio chạy hết HOẶC học sinh bấm "Đã đọc xong") lần đầu trong ngày → cộng ngay 1 gem, ghi `story_reads.reward_claimed=true`; đọc lại trang đó trong cùng ngày → không cộng thêm (chặn cày, cùng logic chống-cày đã dùng ở 6.1 XP lesson).
- Copy động viên nhỏ cuối mỗi trang kiểu "Đọc 1 trang, nhận 1 gem. Giữ chuỗi ngày đọc nhé!" — ngắn, đúng văn phong trẻ tiểu học theo nguyên tắc ở tài liệu KidUX.
- **Test**: (1) đọc hết 1 trang → +1 gem, hiện toast; (2) đọc lại trang đó trong ngày → không cộng thêm, có thông báo rõ "Đã nhận thưởng trang này hôm nay"; (3) sang ngày mới → trang cũ đọc lại vẫn cộng được; (4) audio lỗi/không load được → vẫn đọc chữ bình thường, không chặn tiến trình, chỉ ẩn nút loa; (5) thoát giữa trang → lần sau mở lại đúng trang đang đọc dở, không về trang 1.

### C4. Bảng xếp hạng theo Tier — thêm 1 tab vào `rank/page.tsx`
- Thêm tab thứ 3 vào `Segmented` đã có (`Total stars` / `Day streak` / **`Tier`**), KHÔNG tạo trang mới.
- Tab Tier: hiện `league_groups` tuần hiện tại của học sinh (cùng `cefr_band`, nhóm ~30 bạn cùng trình toàn trường/toàn hệ thống, không chỉ lớp mình) — top 3 podium như 2 tab kia, có nhãn "Tier {group_index}".
- Cuối tuần (cron/Edge Function, xem 4.3): top 20% nhóm → thăng tier (group_index giảm/tốt hơn tuỳ quy ước), đáy 20% → xuống tier, reset `xp_this_week` cho tuần mới.
- **Test**: (1) học sinh mới, chưa có `league_memberships` tuần này → tự động tạo nhóm khi lần đầu vào tab Tier; (2) đủ 30 người trong nhóm → nhóm 31 tạo nhóm mới, không nhồi quá 30; (3) qua ngày reset tuần → XP tuần cũ về 0, vị trí bắt đầu lại từ giữa bảng chứ không phải luôn về đáy (theo kết quả thăng/xuống tuần trước).

### C5. Buddy Pet — thú cưng đồng hành gắn streak
- Icon pet đặt ở góc trang Learn (`page.tsx` hiện tại, cạnh khối "Cấp X — Ong Chăm Chỉ"), bấm mở modal/trang `student/[studentId]/pet`.
- **Bắt buộc theo 0.3**: modal mở ra render skeleton pet ngay lập tức (không màn trắng/spinner toàn màn), dữ liệu thật thay vào khi fetch xong; fetch quá 8s → hiện pet mặc định + nút "Thử lại", không bao giờ treo vô hạn.
- Pet lên `stage` theo `streak_count` hiện tại của học sinh (đọc thẳng từ `users.streak_count` đã có, không tự tính riêng) — đối chiếu `pet_species.stage_thresholds`. Mất streak (`streak_count` về 0) → pet buồn (đổi biểu cảm) nhưng KHÔNG tụt stage đã đạt, chỉ dừng tiến thêm — tránh trừng phạt kép gây trẻ con nản.
- Cho "cho ăn" bằng gems (tối thiểu 5 gems/lần, tối đa 3 lần/ngày) → tăng `happiness`, không ảnh hưởng `stage` (2 trục tách biệt: stage = cam kết dài hạn qua streak, happiness = tương tác ngắn hạn qua gems).
- **Test**: (1) mở modal lần đầu chưa có `student_pets` → tự tạo bản ghi mặc định stage 1, không lỗi; (2) API chậm >8s → hiện fallback + Thử lại, xác nhận bằng cách giả lập mạng chậm; (3) streak về 0 → stage giữ nguyên, chỉ đổi biểu cảm; (4) cho ăn lần thứ 4 trong ngày → nút disable + tooltip "Hôm nay bé no rồi, mai quay lại nhé"; (5) không đủ gems → dialog báo rõ, không trừ âm.

---

## 3. Dependency map

1. `exercises.skill_tag` (1) phải có TRƯỚC khi build C2 Skill Boost — nếu cột chưa tồn tại, tự thêm qua migration, backfill dữ liệu cũ bằng giá trị suy luận thô (vd theo `exercise.type`) rồi để giáo viên/admin sửa tay sau, không để null hết.
2. `role_play_sessions` hoàn thành → cộng `xp_ledger` → CEFR% (mục 6.1 FRS v2) cập nhật → hiện đúng ở Learn/Profile/Roster như mọi nguồn XP khác, không tính riêng.
3. `story_reads` / `role_play_sessions` / `practice_sessions` đều dùng chung 1 hàm cộng thưởng (`awardReward(studentId, gems, xp, source)`) — không viết 3 hàm cộng thưởng riêng lẻ cho 3 tính năng, tránh lệch logic chống-cày.
4. C4 Tier phụ thuộc `users.streak_count`/XP đã tính đúng từ trước — build SAU khi C1–C2 chạy ổn định vài ngày để có dữ liệu XP thật, không launch league rỗng.
5. C5 Pet đọc `streak_count` — không phụ thuộc feature nào khác, có thể làm song song sớm nhất.

---

## 4. Business rules bổ sung (nối tiếp mục 6 của FRS v2, đánh số riêng theo tài liệu này)

**4.1 Role Play KHÔNG vi phạm quy tắc "giai đoạn 1 không auto-score" (6.2 FRS v2)**
`role_play_task_completions` chỉ là **phát hiện từ khoá có mặt trong transcript** để tick nhiệm vụ (giống check-list, nhị phân có/không) — tuyệt đối không gán điểm phát âm/ngữ pháp, không hiện số điểm nào cho học sinh trong C1. Nếu sau này cần chấm chất lượng nói thật, đưa qua giáo viên nghe `role_play_utterances.audio_url` y hệt cơ chế "Nghe & chấm" (B1) đã có — không tự động hoá điểm số ở bản này.

**4.2 Chống cày thưởng — áp dụng thống nhất C2/C3/C1**
Mọi thưởng gems/XP mới trong tài liệu này đều giới hạn tần suất theo nguồn (1 lần/ngày/đối tượng cho story page, 1 lần/phiên hoàn thành cho role-play và practice — không cộng lại khi mở lại session đã `completed`). Dùng chung timestamp check kiểu `last_*_claimed_at` đã áp dụng ở A1b (Flashcard Review) trong FRS v2, không phát minh cơ chế mới.

**4.3 League tính lại theo cron hàng tuần**
Dùng đúng script `scripts/recompute.ts` đã có — thêm bước tính `league_groups`/thăng-xuống hạng vào cuối script đó (chạy theo lịch, ví dụ 00:00 thứ Hai), không tạo script riêng biệt để tránh 2 script giẫm dữ liệu XP lên nhau.

**4.4 Feature flag cho từng mục C1–C5**
Thêm bảng/cấu hình đơn giản (hoặc constant nếu chưa cần bảng riêng) để bật/tắt từng entry point C1–C5 độc lập — bắt buộc theo 0.3, để không lặp lỗi "Coming Soon cụt" của Cheppy khi 1 mục chưa xong mà mục khác đã deploy.

---

## 5. Supabase — kết nối & phạm vi RLS

**Dự án**: `beeblast-demo` (region `ap-southeast-1`, Postgres 17).

**Cấu hình trong `.env.local`**:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**Tuyệt đối không**: không lấy/không dùng `service_role` key ở bất kỳ đâu trong `src` (client hay server component chạy trong request user) — đúng nguyên tắc 7.3 FRS v2. Nếu C4 (tính league cuối tuần) cần bypass RLS để đọc toàn trường, chỉ làm trong Edge Function riêng, key `service_role` lấy qua Supabase secrets của project, không hardcode trong repo.

**RLS cho bảng mới (áp dụng đúng khung đã có ở 7.3 FRS v2)**:
- `role_play_sessions`, `role_play_utterances`, `practice_sessions`, `student_pets`, `story_reads`: học sinh chỉ đọc/ghi bản ghi của chính mình (`auth.uid() = student_id`); giáo viên của lớp học sinh đó chỉ ĐỌC (để xem trong Portfolio sau này nếu cần), không ghi/sửa.
- `role_play_topics`, `role_play_tasks`, `stories`, `story_pages`, `pet_species`, `league_groups`: nội dung dùng chung, mọi role đã đăng nhập ĐỌC được, chỉ ghi được qua admin/teacher tool riêng (không mở ghi cho học sinh).
- `league_memberships`: học sinh đọc được nhóm của chính mình + các thành viên cùng nhóm (để hiện bảng xếp hạng), không đọc được nhóm khác, không ghi được (chỉ Edge Function ghi khi tính lại tuần).
- Bật RLS ngay khi tạo bảng trong cùng migration, không tách bước — tránh cửa sổ hở dữ liệu như đã cảnh báo ở 7.3.

---

## 6. Bắt buộc chạy test trước khi báo Done

1. `npm run lint` — 0 lỗi, và chạy `grep -rn "slate-\|sky-\|rose-\|amber-\|emerald-\|zinc-\|gray-" src` phải rỗng cho MỌI file mới ở C1–C5 (đúng quy tắc design system đã chốt, xem file `Beeblast_FIX_DesignSystem_ClassPicker_KidUX_v1.md`).
2. `npm run test` (vitest) — thêm test thuần logic (không cần DOM) cho: hàm tính sao mastery C2, hàm chống-cày thưởng 4.2, hàm chia nhóm league 30 người C4, hàm so khớp `keyword_hints` C1.
3. `npm run build` — build production không lỗi type.
4. Test tay theo checklist từng mục C1–C5 ở trên, done nghĩa là: (a) đúng happy path; (b) F5 giữa chừng không mất tiến trình; (c) mất mạng giữa chừng không mất input/không mất thưởng đã cộng; (d) không màn hình nào chỉ có spinner không lối thoát (0.3); (e) đúng ở ~375px và ~1440px; (f) chỉ dùng token `st-*` và component `Tile/Mono/ProgressTrack/Segmented/StatusChip` đã có, không màu/style rời rạc mới.
5. Sau khi xong, chạy lại nhanh test case của `rank` (C4 đụng file cũ) và của Learn/Profile (vì C1–C3 đều cộng qua `xp_ledger` chung) để chắc không phá tính năng cũ — đúng nguyên tắc dependency-map testing đã có ở FRS v2 mục 5.

---

## 7. Ghi chú bàn giao

Tài liệu đủ để Antigravity build thẳng: data model (mục 1), spec từng nút/trạng thái/test case theo tính năng (mục 2), thứ tự phụ thuộc (mục 3), business rule đã chốt kể cả điểm dễ gây tranh cãi — role play có auto-check nhưng không auto-score (4.1), Supabase project + key thật (mục 5), và điều kiện Done + lệnh test cụ thể (mục 6). Phần còn để mở, cần quyết định thêm sau khi có dữ liệu thật: số gems/XP thưởng chính xác cho C1–C3 (đề xuất khởi điểm: role-play 30 gems + 50 XP/lần hoàn thành, story page 1 gem/trang, practice session 40–70 gems tuỳ số câu — theo đúng tỉ lệ đang thấy ở `xp_ledger` hiện tại), và loài/hình ảnh cụ thể cho `pet_species` (giai đoạn 1 có thể dùng tạm mascot ong 🐝 làm loài duy nhất, mở species khác ở Shop sau).
