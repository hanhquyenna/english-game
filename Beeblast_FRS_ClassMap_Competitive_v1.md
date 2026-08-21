# Beeblast — FRS Class Map + Consistency Pass v1 (bản chốt để giao Antigravity)

Đọc trực tiếp source code đang chạy tại `/Users/ad/Documents/Beeblast` — `src/lib/islands.ts`, `src/lib/lesson-path.ts`, `src/hooks/use-realtime-refresh.ts`, `src/components/student/beeblast-world-canvas.tsx`, `src/components/student/learn-map-client.tsx`, toàn bộ `supabase/migrations/*.sql` — không đoán. Mọi số liệu vi phạm dưới đây là kết quả grep thật trên `src`.

**Concept chốt (theo yêu cầu):** main menu giữ nguyên dạng "căn phòng nhỏ có các khu chọn được" (đã có = `beeblast-world-canvas.tsx`). Trọng tâm nâng cấp: **Learn** và **Arena**. Một map = **7–8 challenge + 1 final boss**. Hoàn thành challenge → tiến sang challenge/map kế tiếp. **~20 học sinh cùng lớp cùng xuất hiện trên map**, thấy nhau di chuyển → tạo tính cạnh tranh.

---

## 0. Chẩn đoán: concept này đã có sẵn ~70% trong code, không cần xây lại

### 0.1 Cấu trúc "7–8 challenge + 1 boss" ĐÃ tồn tại

`src/lib/islands.ts` hiện sinh ra đúng cấu trúc đó, chỉ khác con số:

```ts
export const LEVELS_PER_ISLAND = 6;          // 6 challenge node
// ... vòng lặp tạo 6 node "Lesson N"
nodes.push({ level: null, label: "Exam", isExam: true,
  status: done >= LEVELS_PER_ISLAND && topic.hasExam ? "active" : "locked" });
```

- 6 node challenge + 1 node `Exam` mở khoá **chỉ khi cả 6 node kia xong** → **node Exam chính là final boss** anh đang mô tả. Không cần khái niệm mới.
- "Hoàn thành challenge → sang challenge kế tiếp" đã có: `levelsDone(percent)` → `activeLevel = done + 1`, và `currentPosition(islands)` trả về đúng 1 node đang đứng.
- "Sang map kế tiếp" đã có ở `lesson-path.ts`: `UNLOCK_THRESHOLD = 40` — map (topic) sau mở khi map trước đạt 40%.

**Thay đổi cần thiết: 1 dòng.** `LEVELS_PER_ISLAND = 6` → `8`. `sliceForLevel()` tự chia lại exercise của topic thành 8 slice, không cần sửa gì thêm.

> **Bắt buộc chạy lại `npm run test`** — `src/lib/islands.test.ts`, `lesson-path.test.ts`, `progression.test.ts` có assert theo con số 6. Sửa expectation trong test theo 8, **không** sửa logic để test xanh.

**Cân nhắc sư phạm trước khi chốt 8:** `sliceForLevel` dùng `Math.ceil(exercises.length / LEVELS_PER_ISLAND)`. Topic có ít hơn 8 exercise → sẽ có node rỗng. **Test case bắt buộc**: topic có 3, 7, 8, 20 exercise — không node nào được rỗng hoặc trùng exercise. Nếu topic ngắn, dùng `Math.min(8, exercises.length)` node thay vì luôn 8.

### 0.2 Phần "20 học sinh trên cùng map" — KHÔNG cần bảng mới

Đây là phần tưởng khó nhất nhưng dữ liệu đã đủ 100%:

| Cần gì | Đã có ở đâu |
|---|---|
| Ai trong lớp (~20 em) | `enrollments (student_id, class_id)` — `0001_init.sql:32` |
| Mỗi em đang ở node nào | `topic_progress (student_id, topic_id, percent_complete)` — `0001_init.sql:140`. Chạy `currentPosition()` cho từng em. |
| Mỗi em trông như thế nào | `student_avatars` + `react-peeps`, đã render ở header/profile/shop |
| Thấy nhau di chuyển realtime | `topic_progress` đã nằm trong publication `supabase_realtime` (`0002_rls_and_realtime.sql:18,40`); hook `useRealtimeRefresh(["topic_progress"])` đã viết sẵn, có debounce 250ms |
| Tầng thi đua theo tuần | `league_groups (week_start_date, cefr_band, group_index)` + `league_memberships` — `0010_game_loop_v1.sql:124` |

**Kết luận: 0 migration mới cho v1.** Vị trí của bạn cùng lớp là **view dẫn xuất** từ dữ liệu app đang ghi mỗi ngày.

### 0.3 Nhưng có 1 chốt chặn thật, phải làm trước

Grep thật trên `src` hôm nay:

- **285 lần** dùng class Tailwind mặc định (`slate-`, `sky-`, `rose-`, `amber-`, `emerald-`, `zinc-`, `gray-`, `neutral-`) trên **29 file**
- **16 emoji** còn trong `src/app/student` + `src/components/student`

Cả hai đều đã bị cấm bằng văn bản ở `Beeblast_FIX_DesignSystem_ClassPicker_KidUX_v1.md` §1.4 và `Beeblast_FRS_KenneyWorldSkin_v1.md` §2.1 — **gate chưa bao giờ được thực thi**. Nặng nhất lại đúng file mà FRS này sẽ sửa:

| Vi phạm | File |
|---|---|
| 30 | `components/student/learn-map-client.tsx` ← file trung tâm của FRS này |
| 29 | `components/student/vault-client.tsx` |
| 16 | `components/teacher/student-portfolio-detail-client.tsx` |
| 12 | `components/teacher/class-post-form.tsx` |
| 11 | `components/student/journal-prompt.tsx` |
| 10 | `components/student/vault-review-client.tsx` |
| 7 | `components/ui/toast-container.tsx`, `teacher/dashboard-client.tsx`, `student/beeblast-world-canvas.tsx` |
| ≤5 | 20 file còn lại |

Hiện app đang chạy **3 ngôn ngữ hình ảnh cùng lúc**: (a) world Kenney minh hoạ, (b) hệ token neo-brutalist `st-*` khai báo ở `globals.css`, (c) Tailwind mặc định vá tạm. Thêm map mới lên nền này chỉ sinh ra ngôn ngữ thứ 4.

**Vì vậy thứ tự thi công là bắt buộc, không phải tuỳ chọn: Stage 1 xong mới sang Stage 2.**

---

## Stage 0 — Chốt an toàn trước khi refactor

`git status` hiện có **30+ file đã sửa chưa commit**, commit cuối cùng là `c3676f0 Restyle student app to the UX deep-dive prototype`.

1. `npm run test` → phải xanh **trước** khi commit.
2. Commit toàn bộ work đang treo thành 1 commit mô tả rõ ("WIP: kenney world canvas + arena"), để Stage 1 có điểm revert.
3. Tạo branch `feat/class-map` cho toàn bộ FRS này.

**Không được bắt đầu Stage 1 khi cây làm việc còn bẩn** — nếu không sẽ không phân biệt được lỗi do refactor màu hay do work cũ.

---

## Stage 1 — Consistency pass (điều kiện tiên quyết)

Mục tiêu: 1 app = 1 hệ token. Không thêm tính năng nào ở stage này.

### 1.1 Bảng quy đổi bắt buộc

Áp dụng cho cả 29 file, sửa 1 lượt, không sửa lẻ:

| Đang dùng | Đổi thành |
|---|---|
| `bg-slate-900/800/700` (nền tối) | `bg-st-card` (nếu là card) hoặc `bg-st-bg` (nếu là nền trang) |
| `text-amber-300/400` | `text-st-accent` |
| `bg-sky-500` | `bg-st-primary` (nút chính) hoặc `bg-st-secondary` (nút phụ) |
| `bg-rose-600` / `bg-red-*` | `bg-st-destructive` |
| `border-slate-700` | `border-st-input` hoặc `border-st-fg` (viền tile 2px) |
| `text-gray-*` / `text-zinc-*` | `text-st-muted-fg` |
| `bg-emerald-*` | `bg-st-secondary` |

Token đầy đủ khai báo ở `src/app/globals.css`, block `[data-persona="student"]`. **App không có dark mode** — không có lý do tồn tại nền tối ở bất cứ đâu.

### 1.2 Emoji → lucide-react hoặc tile Kenney

16 emoji còn lại: thay bằng icon `lucide-react` (đã là dependency, đã import sẵn ở nhiều file) hoặc tile Kenney theo bảng tra ở `Beeblast_FRS_KenneyWorldSkin_v1.md` §3. Cụ thể đã biết: `🎙️`→`Mic`, `🎯`→`Target`, `📚`→`BookOpen`, `🐝`→`tile_0094.png` (tổ ong), `🔥`→`Flame`, `💎`→`Zap` hoặc `/assets/items/gem.svg` (đã có sẵn trong repo).

### 1.3 Lint gate — thêm vào CI/pre-commit, đây là phần khiến fix không tái phát

```bash
# Cả hai lệnh PHẢI trả về rỗng, nếu không -> fail build
grep -rnE "slate-|sky-|rose-|amber-|emerald-|zinc-|gray-|neutral-" src && exit 1
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/app/student src/components/student && exit 1
```

Thêm thành script `npm run lint:tokens` trong `package.json` và gọi trong `npm run lint`. **Không có gate này thì Stage 1 sẽ bị phá lại trong 2 tuần** — đúng như đã xảy ra với 2 FRS trước.

### 1.4 Điều kiện hoàn thành Stage 1

- [ ] `npm run lint:tokens` rỗng
- [ ] `npm run test` xanh
- [ ] Mở tay 3 màn: `/student/{id}` (hub), `/student/{id}/learn-map`, `/student/{id}/arena` — không còn khối nền tối nào trên nền be `#efe3cf`
- [ ] `/teacher/{id}/portfolio` — tile "Nhật ký mới nhất" không còn nền navy (lỗi đã ghi ở FIX doc §4)

---

## Stage 2 — Class Map: 8 challenge + boss + bạn cùng lớp

### 2.1 Cấu trúc map

- `LEVELS_PER_ISLAND: 6 → 8` trong `src/lib/islands.ts`.
- Node thứ 9 = `isExam: true` → **render như FINAL BOSS**, không phải như 8 node kia: to hơn (~1.6×), có tile lâu đài (`tile_0096-0125`) làm bệ, có NPC Kenney đứng canh (pose `interact`), viền `st-tile` dày hơn, nhãn "BOSS" bằng `.st-mono`.
- Node boss `locked` → hiện dạng silhouette tối màu **bằng token** (`bg-st-muted` + `opacity`), tuyệt đối không dùng `slate-*`.
- Giữ nguyên `sliceForLevel()`, `currentPosition()`, `UNLOCK_THRESHOLD` — **không đụng business logic**.

### 2.2 Đường đi phải là "nơi chốn", không phải cột tròn

Lỗi đã chẩn đoán ở `island-band.tsx:132`: `translateX(Math.sin(i * 0.85) * 38)` — biên độ 38px quá nhỏ so với bề rộng thẻ nên vẫn nhìn ra hình tròn xếp dọc.

- Tăng biên độ uốn lên **~35% chiều rộng container** (responsive, không hardcode px).
- Nền map: tile cỏ `tile_0000` lặp + đường mòn `tile_0041` **vẽ nối giữa các node** (không phải chỉ nền phẳng `ISLAND_TINTS`), rải cây `tile_0015/0016` + nấm `tile_0029` hai bên đường.
- `image-rendering: pixelated` trên mọi tile Kenney. **Test 1x/2x/3x DPI** — không được nhoè.

### 2.3 Bạn cùng lớp trên map (phần cốt lõi của concept)

**Truy vấn** (Server Component, `src/lib/queries.ts`):

```
enrollments(class_id của student hiện tại)
  → danh sách student_id cùng lớp
  → topic_progress cho các student_id đó
  → currentPosition() cho từng em  =>  { studentId, topicId, level }
  → join student_avatars để lấy hình
```

**Render:**
- Mỗi bạn cùng lớp = avatar `react-peeps` **kích thước nhỏ (~24px)**, đặt quanh node em đó đang đứng.
- **Nhiều em cùng 1 node là trường hợp phổ biến nhất, không phải edge case.** Xoè theo vòng cung quanh node (fan-out theo góc, bán kính tăng dần khi >6 em), không được đè chồng lên nhau. Quá 8 em trên 1 node → hiện 8 avatar + chip `+N` bấm ra danh sách.
- Học sinh đang đăng nhập: avatar **to hơn (~40px)**, có vòng highlight `--st-primary`, luôn vẽ trên cùng (z-index cao nhất) để em luôn tìm thấy mình ngay.
- Bấm 1 avatar bạn → route `/student/{id}/profile/{classmateId}` (**route đã tồn tại**, không cần làm mới).

**Realtime:** `useRealtimeRefresh(["topic_progress"], { debounceMs: 250 })` — đã có sẵn. Khi 1 bạn hoàn thành challenge, avatar em đó dịch sang node kế tiếp trên máy mọi người. Dùng `animate-rise` / `animate-pop` (đã khai báo trong `globals.css`) cho chuyển động, **không** teleport đột ngột.

**Test case bắt buộc:**
- Lớp 20 em, 15 em cùng đứng 1 node → không avatar nào bị đè, không tràn ra ngoài container, mobile 375px vẫn đọc được
- Em mới vào lớp chưa có `topic_progress` → đứng ở node 1, không crash, không mất tích
- 1 em hoàn thành challenge → trong ≤2s avatar em đó dịch node trên tab của em khác
- `prefers-reduced-motion: reduce` → avatar dịch tức thì, không animate

### 2.4 Tính cạnh tranh — nhưng phải an toàn cho trẻ 6–11 tuổi

Đây là phần cần đặc tả cẩn thận, không phải chỉ vấn đề kỹ thuật.

**Bắt buộc:**
- Trên map, bạn cùng lớp thể hiện **sự hiện diện ("có bạn cùng học")**, KHÔNG phải bảng xếp hạng. Không đánh số thứ tự 1→20 cạnh avatar. Không hiện "em đứng thứ 18/20" ở bất kỳ đâu trên Learn map.
- Em ở sau cùng **không được nhìn thấy mình là người cuối** như một trạng thái thường trực mỗi ngày. Đây là rủi ro thật với lứa tiểu học, không phải lo xa.
- Xếp hạng thật (nếu cần) chỉ nằm ở `/rank` (Hall of Fame) và **nhóm theo `league_groups.cefr_band`** — đúng mục đích cột đó đã được thiết kế ở migration 0010: em chỉ so với các bạn cùng trình độ, không so với cả lớp.
- Ưu tiên khung "cả lớp cùng tiến": hiện thanh tiến độ **của lớp** trên đầu map ("Lớp 4A đã mở 5/8 thử thách") — thi đua hướng hợp tác, vẫn tạo động lực mà không tạo người thua thường trực.

**Áp dụng nguyên tắc §3 của FIX doc:** trên map học sinh, KHÔNG hiện `B2 — 27.3% to C1` hay `52.2/100`. Hiện cấp độ + mascot + số sao. Số CEFR thật giữ nguyên đầy đủ ở phía Giáo viên.

### 2.5 Bảo mật — phải kiểm trước khi có lớp thật

RLS trong `0002_rls_and_realtime.sql` hiện đang **permissive cho mục đích demo** — `topic_progress` nằm trong danh sách mở. Trước khi có dữ liệu học sinh thật:

- Viết policy: student chỉ `select` được `topic_progress` của các student **cùng `class_id`** với mình (join qua `enrollments`), không phải toàn bảng.
- Test bằng 2 tài khoản ở 2 lớp khác nhau: em lớp A **không** đọc được tiến độ em lớp B.

**Đây là dữ liệu học tập của trẻ vị thành niên** — không được để mở khi lên production.

---

## Stage 3 — Arena

- Arena hiện ở `arena-client.tsx` (5 vi phạm màu, đã fix ở Stage 1). Bảng `arena_topics` đã có (`0010_game_loop_v1.sql`).
- Giữ đúng nguyên tắc §2.3 của Kenney FRS: **bề mặt "thế giới" dùng tile Kenney, bề mặt "làm bài" giữ token `st-*`**. Arena là nơi ôn lỗi sai → khung ngoài minh hoạ sân đấu, phần câu hỏi vẫn là UI form chuẩn. Không kenney-hoá màn làm bài.
- Mascot phản hồi cảm xúc (thiếu sót #4 đã ghi ở Kenney FRS §0): dùng pose `cheer0/cheer1` khi đúng, `hurt` khi sai, `think` khi đang chờ. Asset đã có đủ 45 pose/nhân vật trong `public/kenney/toon-characters/*/PNG/Poses/`.
- **Không** thêm NPC thứ hai đại diện học sinh — `react-peeps` là danh tính học sinh, `toon-characters` là NPC. Ranh giới này đã chốt ở Kenney FRS §2.2, giữ nguyên.

---

## 4. Thứ tự thi công (không đảo)

| Stage | Nội dung | Điều kiện sang stage sau |
|---|---|---|
| 0 | Test xanh, commit work treo, tạo branch | Cây làm việc sạch |
| 1 | Consistency pass 29 file + lint gate | `lint:tokens` rỗng, test xanh |
| 2a | `LEVELS_PER_ISLAND` → 8, boss node | `islands.test.ts` xanh với 8 |
| 2b | Map là "nơi chốn" (tile, đường mòn, biên độ uốn) | Kiểm mắt 1x/2x/3x DPI |
| 2c | Bạn cùng lớp + realtime | 4 test case §2.3 pass |
| 2d | RLS theo class | 2 tài khoản khác lớp không đọc chéo |
| 3 | Arena + mascot phản hồi | — |

**Nguyên tắc xuyên suốt:** không stage nào được sửa file trong `src/lib/` ngoài đúng 1 dòng `LEVELS_PER_ISLAND`. `cefr-engine`, `sm2`, `game-loop`, `level-engine`, `progression` đã có unit test và đang chạy đúng — toàn bộ FRS này là việc của tầng trình bày.
