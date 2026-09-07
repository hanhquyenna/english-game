# Beeblast — FRS Class Map + Nhân vật di chuyển + Shop tương tác v1 (bản chốt giao Antigravity)

Đọc trực tiếp source code đang chạy tại `/Users/ad/Documents/Beeblast` — `src/components/student-avatar.tsx`, `src/components/student/kenney-story-dialog.tsx`, `src/lib/islands.ts`, `src/lib/queries.ts`, `src/hooks/use-realtime-refresh.ts`, `src/app/student/[studentId]/learn-map/page.tsx`, toàn bộ `supabase/migrations/*.sql` — mọi API/tên cột/số dòng dưới đây là thật, không suy đoán.

**Mục tiêu:** học sinh có nhân vật riêng **đi lại được** trên bản đồ 2D của lớp; nhân vật đó **chính là avatar mua ở Shop** (mũ, huy hiệu, nhân vật Kenney đã chọn); ~20 bạn cùng lớp cùng hiện trên bản đồ theo tiến độ thật; 1 map = 8 thử thách + 1 trùm cuối.

**Tài liệu tham chiếu hình ảnh (đã có sẵn trong repo, KHÔNG phải code để copy nguyên):**
- `prototypes/beeblast-class-map.html` — bản demo chạy được, 61fps, dùng để đối chiếu bố cục HUD + cảm giác thị giác.
- `prototypes/verify-map.cjs` — bộ kiểm thử Playwright mẫu (15 assertion × 3 viewport). §10 nói rõ phần nào bê sang được.

---

## 0. Điểm xuất phát — cái gì ĐÃ xong, cái gì CHƯA

**ĐÃ xong (đã commit / đã ghi vào đĩa):**
- Stage 1 consistency pass: 163 vi phạm màu Tailwind mặc định + 17 emoji đã sửa hết trên 34 file. `bash scripts/lint-tokens.sh` → **PASS** cả 3 rule.
- Gate `scripts/lint-tokens.sh` đã có 3 rule + đã nối vào `npm run lint` và `npm run verify` trong `package.json`.
- Sửa 1 bug chưa ai đặc tả: 73 chỗ dùng token `st-*` trong file phía Giáo viên. `--st-*` chỉ khai báo trong `[data-persona="student"]`, nên trên trang Giáo viên nó **undefined → CSS declaration bị bỏ → element render KHÔNG có style** (không phải sai màu). Đây là nguyên nhân gốc của lỗi "tile Portfolio Giáo viên nhìn như hỏng".
- WIP cũ đã commit `e3b8c9a` trên `main`.

**CHƯA xong (chính là phạm vi tài liệu này):**
- Bản đồ lớp chưa tồn tại trong app. Prototype là **1 file HTML rời trong `prototypes/`**, không phải React component, không có route, không đọc Supabase. `npm run dev` KHÔNG hiện nó.
- Nhân vật học sinh chưa đi lại được trên bản đồ nào (kể cả `beeblast-world-canvas.tsx` — nó có di chuyển nhưng nhân vật là sprite Kenney cứng, không nối với Shop).
- `LEVELS_PER_ISLAND` vẫn là 6.
- Chưa có branch `feat/class-map` (git qua mount không tạo được, xem §10.0).

---

## 1. Quyết định kiến trúc BẮT BUỘC: canvas cho địa hình, DOM cho nhân vật

Đây là quyết định quan trọng nhất của tài liệu này. Làm sai chỗ này thì phải viết lại toàn bộ hệ avatar.

| Lớp | Kỹ thuật | Vì sao |
|---|---|---|
| Địa hình (cỏ, đường, nước, cây, nhà) | `<canvas>` 2D, sinh thủ tục, **cache vào offscreen canvas** | ~2.600 tile/khung hình. Vẽ lại mỗi frame đo được **17fps**. Cache rồi blit → **61fps**. Xem §8. |
| Nhân vật (em + ~20 bạn) | **DOM, `<StudentAvatar>` React component có sẵn** | Đây là lý do cả hệ Shop tiếp tục chạy mà không sửa 1 dòng. |
| HUD (thẻ người chơi, chip, quest, minimap, tool belt) | DOM + token `st-*` | Đã có sẵn design system. |

**Vì sao KHÔNG vẽ nhân vật lên canvas:** `src/components/student-avatar.tsx` là 1 React component render `<img>` Kenney + overlay mũ/huy hiệu `<img>` từ `/assets/items/*.svg`. Nếu chuyển nhân vật vào canvas thì phải tự vẽ lại toàn bộ logic đó bằng `drawImage`, tự quản lý cache ảnh, tự vẽ lại overlay mũ — tức là **viết lại hệ avatar lần 2**, và Shop sẽ phải bảo trì 2 đường render song song. Đặt nhân vật là `<div position:absolute>` phía trên canvas thì `<StudentAvatar>` dùng nguyên bản, mua mũ ở Shop là mũ hiện trên map ngay, không cần code thêm.

**20 avatar là DOM node — có nặng không?** Không. 21 `<img>` được translate mỗi frame là việc compositor làm thoải mái. Ràng buộc: **chỉ đổi `transform`**, không đổi `left/top` (tránh layout reflow mỗi frame). Xem §8.3.

---

## 2. Hệ avatar hiện tại — đọc kỹ trước khi code

**`StudentAvatar` KHÔNG còn dùng `react-peeps`.** `src/lib/peeps.ts` vẫn nằm trong repo nhưng component đã chuyển sang **Kenney Toon Characters PNG**. Đừng nhìn `peeps.ts` rồi kết luận sai.

```ts
// src/components/student/kenney-story-dialog.tsx (đã export sẵn)
npcSrc(pose: string, character: NpcCharacter): string
// -> `/kenney/toon-characters/${character}/PNG/Poses/character_${charKey}_${pose}.png`
```

`NpcCharacter` = `"Female adventurer" | "Female person" | "Male adventurer" | "Male person" | "Robot" | "Zombie"`.
Trong app học sinh **chỉ dùng 4 loại đầu** — `Robot`/`Zombie` đã chủ động loại khỏi repo theo `Beeblast_FRS_KenneyWorldSkin_v1.md` §1. `getCharacterForSeed()` trong `student-avatar.tsx` vẫn còn liệt kê 6 → **đây là bug nhỏ cần sửa** (xem §5.4).

**Pose có sẵn (45 pose/nhân vật, đã nằm trong `public/kenney/toon-characters/*/PNG/Poses/`):**
`idle`, `walk0`…`walk7`, `talk`, `think`, `cheer0`, `cheer1`, `hurt`, `jump`, `climb`, `interact`, …

> **Đây là món quà lớn nhất cho tài liệu này: `walk0`–`walk7` = 8 frame chu kỳ đi bộ đã có sẵn.** Không cần vẽ, không cần mua, không cần Blender. Nhân vật đi lại trên map = đổi prop `pose` theo thời gian.

**Props của `StudentAvatar` (dùng đúng, đừng thêm prop mới):**
```ts
{ seed, overrides, size, variant, items, ring, ringWidth, glow,
  background, shape, label, labelColor, className, title, pose, noFrame }
```
Trên bản đồ dùng: `seed`, `overrides`, `size`, `items`, `pose`, `noFrame={true}` (bỏ khung tròn/viền để nhân vật đứng trên cỏ chứ không phải trong 1 huy hiệu), `label` chỉ cho chính em.

**Dữ liệu avatar lấy ở đâu (đã có hàm, KHÔNG viết mới):**
```ts
// src/lib/queries.ts:115
getAvatars(studentIds: string[]): Promise<Map<string, {
  seed: string;
  frameColor: string | null;
  items: EquippedItem[];          // { icon, slot: 'hat'|'badge', color?, label? }
  overrides: Partial<PeepConfig>; // chứa overrides.character
  gems: number;
}>>
```
Nguồn: `student_avatars` (`base_avatar_seed`, `equipped_accessory_ids` jsonb, `peep_overrides`, `current_rank_frame_id`) join `avatars`.

---

## 3. Data contract — chốt trước khi viết component

Định nghĩa 1 lần, cả server và client dùng chung. Đặt trong `src/lib/class-map.ts` (file mới, **pure, không import React, không import Supabase** → unit-test được).

```ts
export type MapNodeStatus = "done" | "active" | "locked";

export type MapNode = {
  index: number;            // 0..8
  topicId: string;
  level: number | null;     // 1..8 cho thử thách; null cho boss
  isBoss: boolean;          // node cuối của island = exam node
  name: string;             // tên unit, tiếng Việt
  status: MapNodeStatus;
  grid: { x: number; y: number };   // toạ độ ô trên lưới iso
};

export type MapMate = {
  studentId: string;
  name: string;
  nodeIndex: number;        // đang đứng ở node nào
  seed: string;
  overrides: Record<string, unknown>;
  items: { icon: string; slot: "hat" | "badge"; color?: string; label?: string }[];
  isMe: boolean;
};

export type ClassMapData = {
  className: string;
  nodes: MapNode[];
  mates: MapMate[];
  myNodeIndex: number;
  classUnlocked: number;    // số node cả lớp đã mở — cho thanh tiến độ lớp
  totalNodes: number;
};
```

**Hàm pure phải viết trong `src/lib/class-map.ts`:**

```ts
/** Toạ độ lưới cho N node, đường đi zig-zag chéo. Deterministic. */
export function nodeGrid(count: number): { x: number; y: number }[]

/** Island (đã có từ buildIslands) -> MapNode[]. */
export function toMapNodes(island: Island, unitName: string): MapNode[]

/** progress % của 1 học sinh -> node index em đó đang đứng. */
export function nodeIndexFor(percentComplete: number, totalNodes: number): number

/** Xoè nhiều bạn quanh 1 node, không đè nhau. Trả offset theo pixel world. */
export function fanOffsets(count: number): { dx: number; dy: number }[]
```

`nodeGrid(9)` phải trả đúng dãy đã kiểm mắt trong prototype:
`[7,26] [10,25] [12,22] [15,21] [17,18] [20,17] [22,14] [25,11] [27,8]`
(lưới iso `TW=56, TH=28`, `iso(gx,gy) = { x:(gx-gy)*28, y:(gx+gy)*14 }`)

**Query mới trong `src/lib/queries.ts`** (đặt cạnh `getIslandTopics`, dùng lại hàm có sẵn, KHÔNG viết SQL mới):
```ts
export async function getClassMapData(studentId: string): Promise<ClassMapData | null>
```
Các bước, đúng thứ tự:
1. `getClassForStudent(studentId)` → `klass`. Null → trả null, page gọi `notFound()`.
2. `getIslandTopics(klass.id, studentId)` → `buildIslands(topics)` → lấy island đầu tiên chưa xong (hoặc island cuối nếu xong hết) → `toMapNodes()`.
3. `db.from("enrollments").select("student_id, users(id, name)").eq("class_id", klass.id)` → danh sách bạn cùng lớp.
4. `db.from("topic_progress").select("student_id, percent_complete").eq("topic_id", island.topicId).in("student_id", ids)` → tiến độ từng bạn trên **đúng topic của map đang xem**.
5. `getAvatars(ids)` → avatar từng bạn.
6. `nodeIndexFor()` cho từng bạn. Bạn chưa có hàng `topic_progress` → `nodeIndex = 0` (KHÔNG được crash, KHÔNG được biến mất khỏi map).

---

## 4. File cần tạo / sửa — danh sách đóng

**Tạo mới:**
| File | Nội dung |
|---|---|
| `src/lib/class-map.ts` | 4 hàm pure ở §3 |
| `src/lib/class-map.test.ts` | unit test cho 4 hàm đó, xem §10.2 |
| `src/components/student/class-map-canvas.tsx` | **chỉ địa hình**: canvas + offscreen cache. Không biết gì về avatar. |
| `src/components/student/class-map-client.tsx` | component chính: canvas + overlay DOM nhân vật + HUD + di chuyển + dialog |
| `src/app/student/[studentId]/class-map/page.tsx` | Server Component, theo đúng khuôn `learn-map/page.tsx` |
| `tests/class-map.spec.cjs` | Playwright, xem §10.3 |

**Sửa:**
| File | Sửa gì |
|---|---|
| `src/lib/islands.ts` | `LEVELS_PER_ISLAND: 6 → 8` + guard `sliceForLevel` (§7) |
| `src/lib/islands.test.ts` | cập nhật expectation (§7.2) — sửa **kỳ vọng**, KHÔNG sửa logic cho test xanh |
| `src/lib/queries.ts` | thêm `getClassMapData` |
| `src/components/student-avatar.tsx` | bỏ `Robot`/`Zombie` khỏi `CHARACTERS` (§5.4) |
| `src/components/student/student-shell.tsx` | thêm mục điều hướng tới `/class-map` |

**KHÔNG được sửa:** `src/lib/cefr-engine.ts`, `sm2.ts`, `game-loop.ts`, `level-engine.ts`, `progression.ts`, `level-service.ts`, `src/app/globals.css`, `scripts/lint-tokens.sh`. Toàn bộ tài liệu này là việc của tầng trình bày + 1 dòng `LEVELS_PER_ISLAND`.

---

## 5. Nhân vật di chuyển được — đặc tả chi tiết

### 5.1 Điều khiển
- **Desktop:** WASD + phím mũi tên. Tham chiếu cách làm đã có: `beeblast-world-canvas.tsx` dòng ~150 (`keysPressed` ref + game loop `requestAnimationFrame`). Dùng lại pattern đó, đừng phát minh lại.
- **Mobile:** kéo trên màn hình để đi (virtual joystick). `beeblast-world-canvas.tsx` đã có `touchVector` ref — dùng lại.
- **Bấm/tap vào 1 node:** nhân vật **tự đi tới** node đó (đi theo đường, không xuyên cây), tới thì mở dialog. Đây là cách chính trên mobile vì tay trẻ con điều khiển joystick kém.

### 5.2 Chu kỳ đi bộ
```ts
const WALK_FPS = 10;                       // 10 frame/giây, mượt mà không nhấp
const pose = moving ? `walk${Math.floor(t * WALK_FPS) % 8}` : "idle";
```
- Đứng yên → `idle`.
- Quay mặt: sprite Kenney vẽ hướng sang phải → đi sang trái thì `transform: scaleX(-1)`.
- **Bắt buộc:** preload cả 8 ảnh `walk0..walk7` cho nhân vật của em **khi mount**, nếu không frame đầu mỗi hướng sẽ nháy trắng. Dùng `new Image().src = npcSrc('walk'+i, character)` trong `useEffect`.
- Tốc độ: **~3.2 ô lưới/giây**. Chậm hơn thì trẻ con sốt ruột, nhanh hơn thì lướt qua mất node.

### 5.3 Va chạm & giới hạn
- Đi được: ô thuộc `path` (đường + khoảng trống quanh node). Đi trên cỏ **cũng được** — chỉ chậm hơn 30% (cảm giác "lối tắt qua đồng"). Nước và ô có cây thì **không** đi qua.
- Camera đi theo nhân vật (dead-zone ~25% giữa màn hình: nhân vật đi trong vùng đó thì camera đứng yên, ra ngoài mới kéo theo). Tuyệt đối không camera dính cứng — sẽ gây say.
- **Node đã locked vẫn đi tới được** và vẫn mở dialog, nhưng dialog nói "chưa mở" + nút bị vô hiệu. Cho trẻ con nhìn thấy phần thưởng phía trước là động lực; chặn không cho lại gần là hình phạt vô nghĩa.

### 5.4 Nhân vật = avatar Shop, không phải sprite riêng
- Nhân vật trên map render bằng:
```tsx
<StudentAvatar
  seed={me.seed} overrides={me.overrides} items={me.items}
  size={46} pose={pose} noFrame label="EM" />
```
- **KHÔNG** tạo hệ tuỳ biến nhân vật thứ hai. Ranh giới đã chốt ở `Beeblast_FRS_KenneyWorldSkin_v1.md` §2.2 và vẫn giữ: `toon-characters` = danh tính học sinh (qua `StudentAvatar`); NPC hướng dẫn trong dialog là 1 instance khác của cùng bộ asset, học sinh không tuỳ biến được.
- Sửa `getCharacterForSeed` trong `student-avatar.tsx`: bỏ `"Robot"`, `"Zombie"` khỏi mảng `CHARACTERS`. Hai bộ này **đã bị xoá khỏi repo**, nên seed nào hash vào chúng sẽ ra `<img>` 404 — ô ảnh vỡ trên bản đồ. Sau khi bỏ, mảng còn 4 phần tử → phân phối seed đổi → **kiểm bằng mắt là mọi học sinh trong seed demo vẫn có nhân vật hiện đúng.**
- **Test bắt buộc:** mua 1 mũ ở `/shop` → quay lại `/class-map` → mũ phải hiện trên đầu nhân vật, không cần refresh (xem realtime §6.3).

---

## 6. Bạn cùng lớp trên bản đồ

### 6.1 Hiển thị
- Mỗi bạn = 1 `<StudentAvatar size={30} noFrame pose="idle">` đặt absolute quanh node em đó đang đứng.
- **Nhiều bạn cùng 1 node là trường hợp phổ biến nhất, không phải edge case.** Dùng `fanOffsets(n)`: xoè theo vòng cung, bán kính tăng dần khi > 5 bạn.
- Quá 8 bạn/node → hiện 8 avatar + chip `+N`. Bấm chip mở danh sách dọc đầy đủ. **Không được im lặng ẩn bạn nào.**
- Nhân vật của em: `size={46}`, có vòng highlight `--st-primary`, `z-index` cao nhất, có nhãn "EM".
- Bấm avatar 1 bạn → `router.push(/student/{me}/profile/{classmateId})`. **Route này đã tồn tại**, không làm mới.

### 6.2 An toàn cho trẻ 6–11 tuổi — phần này không được bỏ
- Trên bản đồ, bạn cùng lớp thể hiện **sự hiện diện**, KHÔNG phải bảng xếp hạng. **Không đánh số thứ tự 1→20 cạnh avatar. Không hiện "em đứng thứ 18/20" ở bất kỳ đâu trên map.**
- Em yếu nhất lớp không được nhìn thấy mình là người cuối như 1 trạng thái thường trực mỗi ngày.
- Xếp hạng thật chỉ ở `/rank`, và **nhóm theo `league_groups.cefr_band`** — đúng mục đích cột đó đã thiết kế ở migration `0010_game_loop_v1.sql:124`.
- Thay vào đó hiện **thanh tiến độ của cả lớp** trên HUD: "Lớp 4A đã mở 5/9 thử thách" (`classUnlocked / totalNodes`). Thi đua hướng hợp tác.
- Áp `Beeblast_FIX_DesignSystem_ClassPicker_KidUX_v1.md` §3: trên map **không** hiện `B2 — 27.3% to C1` hay `52.2/100`. Hiện cấp độ + nhân vật + số sao. Số CEFR thật giữ nguyên đầy đủ phía Giáo viên.

### 6.3 Realtime
```ts
useRealtimeRefresh(["topic_progress", "student_avatars"], { debounceMs: 300 });
```
- Hook đã có sẵn ở `src/hooks/use-realtime-refresh.ts`, đã debounce, đã coalesce burst.
- `topic_progress` và `student_avatars` **đã nằm trong publication `supabase_realtime`** (`supabase/migrations/0002_rls_and_realtime.sql` dòng 18 và 40) → không cần migration.
- Bạn nào xong thử thách → avatar bạn đó dịch sang node kế tiếp trên máy mọi người trong ≤2s.
- Dịch chuyển phải **animate** (`transition: transform .6s ease-out`), không teleport.
- **Cảnh báo kỹ thuật:** `useRealtimeRefresh` gọi `router.refresh()`. Vị trí nhân vật của em đang là React state trong client component → refresh sẽ re-render server component cha nhưng **state client được giữ**. Phải kiểm: đang đi giữa map, 1 bạn hoàn thành bài → nhân vật của em **không được nhảy về điểm xuất phát**. Nếu bị, giữ vị trí trong `useRef` + `sessionStorage` theo `studentId`.

---

## 7. 8 thử thách + 1 trùm cuối

### 7.1 Thay đổi
`src/lib/islands.ts`:
```ts
export const LEVELS_PER_ISLAND = 8;   // was 6
```
Node thứ 9 (`isExam: true`) **chính là trùm cuối** — khái niệm đã có, chỉ đổi cách render (xem §7.3).

**Guard bắt buộc cho topic ngắn.** `sliceForLevel` dùng `Math.ceil(exercises.length / LEVELS_PER_ISLAND)`. Topic có 3 bài tập → `per = 1` → level 4..8 rỗng. Sửa: số node thực tế = `Math.min(LEVELS_PER_ISLAND, exercises.length)`, và node vượt quá thì **không render**, không render node rỗng bấm vào ra màn trắng.

### 7.2 Cập nhật `src/lib/islands.test.ts` — giá trị chính xác
`levelsDone(p) = floor(p/100 * LEVELS_PER_ISLAND)`. Với 8, ngưỡng lên 1 level là `p ≥ 12.5`:

| Dòng hiện tại | Đang kỳ vọng (cho 6) | Phải đổi thành (cho 8) |
|---|---|---|
| `levelsDone(0)` | `0` | `0` (giữ) |
| `levelsDone(16)` | `0` | **`1`** — hoặc đổi input thành `levelsDone(12)` → `0` |
| `levelsDone(17)` | `1` | `1` (giữ) |
| `levelsDone(50)` | `3` | **`4`** |
| `levelsDone(100)` | `LEVELS_PER_ISLAND` | giữ (đã tham số hoá) |
| `levelsDone(-40)` / `levelsDone(400)` | `0` / `LEVELS_PER_ISLAND` | giữ |
| `island.nodes` `toHaveLength(LEVELS_PER_ISLAND + 1)` | — | giữ (đã tham số hoá) |

Khuyến nghị: đổi `levelsDone(16)` thành **hai** case rõ ràng — `levelsDone(12) === 0` và `levelsDone(13) === 1` — để ngưỡng 12.5 được test tường minh.

**Thêm test case mới bắt buộc:** topic có `3`, `7`, `8`, `20` bài tập → `sliceForLevel` không trả slice rỗng và không trả bài trùng giữa 2 level.

### 7.3 Render trùm cuối
- To hơn node thường ~1.6×, có bệ đá, có NPC canh cửa (pose `interact`), nhãn `BOSS`/`TRÙM CUỐI` bằng `.st-mono`.
- Locked → silhouette **bằng token** (`bg-st-muted` + opacity) + then cửa. **Tuyệt đối không `slate-*`** — gate sẽ chặn.
- Tham chiếu hình: hàm `bossKeep()` trong `prototypes/beeblast-class-map.html` (tháp hai bên, lỗ châu mai, cờ).

---

## 8. Ngân sách hiệu năng — con số thật, đã đo

Prototype **đo được 17fps** ở 1440×900 khi vẽ lại toàn bộ địa hình mỗi frame. Sau khi cache: **61fps desktop / 53 tablet / 61 mobile**. Bộ test bắt được lỗi này, không phải mắt người.

### 8.1 Cache địa hình (bắt buộc)
```
1. Tính đúng vùng ô lưới mà viewport phủ (bounding box của 4 góc màn hình
   đổi về grid space, cộng lề 3 ô cho cây cao nhô vào).
2. Vẽ ground + nước (nền) + cây + nhà 1 lần vào 1 offscreen <canvas>.
3. Cache key = [round(camX), round(camY), Z, W, H, DPR].join('|').
   Key không đổi -> không vẽ lại.
4. Mỗi frame: drawImage(offscreen) + chỉ vẽ lớp thật sự động
   (gợn nước, marker đang pulse).
```
Nhân vật KHÔNG nằm trong canvas nên không nằm trong vòng này.

### 8.2 Ngưỡng nghiệm thu
- **≥ 30fps** trên cả 3 viewport (desktop 1440×900, tablet 834×1112 @2x, mobile 390×844 @2x). Dưới ngưỡng = fail build.
- Không tăng bundle quá **+40KB** gzip. Toàn bộ là canvas 2D + DOM: **không three.js, không WebGL, không thư viện game.** Học sinh dùng điện thoại gia đình ở Việt Nam.

### 8.3 Quy tắc DOM overlay
- Di chuyển avatar **chỉ bằng `transform: translate3d(x,y,0)`**. Đổi `left/top` mỗi frame gây reflow → tụt fps ngay ở 20 node.
- `will-change: transform` trên container avatar, **không** trên từng avatar (quá nhiều layer sẽ ngốn RAM máy yếu).
- `pointer-events: none` trên container, `auto` trên từng avatar để vẫn bấm được mà không chặn kéo bản đồ.

---

## 9. Chữ tiếng Việt — quy tắc cứng, đã bị lỗi 2 lần trong prototype

Font monospace (SF Mono, DejaVu Sans Mono, Consolas) **thiếu glyph Latin Extended Additional**, nên chữ hoa có dấu bị fallback giữa từ và hiện dấu nháy rác. Thực tế đã gặp: `SƠ ĐỒ` → `SƠ ĐÔ\``, `Đồ ăn` → `ĐÔ\`ÁN`, `CẤP` → `CÂP`.

**Có HAI stack font phải sửa, không phải một:**
1. **CSS** — dùng stack sans cho mọi text tiếng Việt.
2. **Canvas 2D** — `ctx.font` là stack riêng, hoàn toàn độc lập với CSS. Prototype sửa CSS xong vẫn còn lỗi ở nhãn vẽ trên canvas.

```
sans:  system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif
mono:  CHỈ dùng cho chữ số ASCII (điểm, gems, streak) — không bao giờ cho tiếng Việt
```

> **Liên quan tới app thật, cần kiểm ngay:** `src/app/globals.css` đặt `--font-st-mono` và class `.st-mono` (10px, uppercase) làm font nhãn của app học sinh. Mọi nhãn **chữ hoa tiếng Việt** đang dùng `.st-mono` đều có nguy cơ này trên iPhone/Android thật. **Việc cần làm: mở app trên 1 iPhone thật, chụp màn Learn + Vault + Shop, soi các nhãn `.st-mono` có dấu.** Đây là bug tiềm ẩn toàn app, không riêng bản đồ.

---

## 10. Vòng lặp thi công: EXECUTE → TEST → VALIDATE

Đây là phần quan trọng nhất. **Không sang bước sau khi bước trước chưa xanh.** Lý do: 3 tài liệu FRS trước đều viết quy tắc rõ ràng và cả 3 đều bị phá, vì quy tắc nằm trong file mà không ai chạy. Vòng lặp này biến quy tắc thành build failure.

### 10.0 Bước 0 — chuẩn bị (làm tay 1 lần)
```bash
cd /Users/ad/Documents/Beeblast
rm -rf _to_delete                 # dọn lock cũ + file staging (Claude không xoá được qua mount)
git gc --prune=now                # dọn ~1.600 tmp_obj_* trong .git/objects
git checkout -b feat/class-map
npm run verify                    # PHẢI xanh trước khi viết dòng code đầu tiên
```
`npm run verify` = `npm run lint:tokens && npm run test`. Cây làm việc phải sạch. Nếu không, sẽ không phân biệt được lỗi do code mới hay do WIP cũ.

### 10.1 Vòng lặp cho MỌI commit
```bash
# 1. EXECUTE  — viết code cho đúng 1 mục nhỏ
# 2. TEST
npm run test                      # vitest, phải giữ 115 pass (+ test mới)
npx tsc --noEmit                  # bỏ qua TS2304 PageProps/LayoutProps (typegen Next, có trước)
# 3. VALIDATE
npm run lint:tokens               # 3 rule, phải PASS
npm run build                     # phải build được, không chỉ dev
node tests/class-map.spec.cjs     # Playwright, xem 10.3
# 4. Xanh hết -> commit. Đỏ -> quay lại 1, KHÔNG commit, KHÔNG sang mục tiếp.
```
**Không được sửa test để test xanh.** Nếu test đỏ vì kỳ vọng cũ sai (ví dụ `LEVELS_PER_ISLAND`), sửa **kỳ vọng** và ghi lý do vào commit message. Nếu test đỏ vì code sai, sửa code.

### 10.2 Unit test bắt buộc — `src/lib/class-map.test.ts`
Chạy bằng vitest, thuần logic, không DOM:

| # | Test | Kỳ vọng |
|---|---|---|
| 1 | `nodeGrid(9)` | đúng 9 toạ độ, khớp dãy ở §3, không trùng ô |
| 2 | `nodeIndexFor(0, 9)` | `0` |
| 3 | `nodeIndexFor(100, 9)` | `8` (node cuối, boss) |
| 4 | `nodeIndexFor(50, 9)` | node giữa, không vượt biên |
| 5 | `nodeIndexFor(-10, 9)` / `nodeIndexFor(999, 9)` | kẹp về `0` / `8`, không NaN |
| 6 | `fanOffsets(1)` | 1 offset, tâm |
| 7 | `fanOffsets(15)` | 15 offset, **không cặp nào cách nhau < 18px** (không đè avatar) |
| 8 | `fanOffsets(0)` | mảng rỗng, không throw |
| 9 | `toMapNodes` với island 8 level + exam | 9 node, node cuối `isBoss: true` |
| 10 | `toMapNodes` với island locked | mọi node `status: "locked"` |
| 11 | Học sinh không có `topic_progress` | `nodeIndex === 0`, không throw, không bị loại khỏi `mates` |
| 12 | `sliceForLevel` với 3/7/8/20 bài tập | không slice rỗng, không bài trùng giữa 2 level |

### 10.3 Test tích hợp bắt buộc — `tests/class-map.spec.cjs`
Bê khuôn từ `prototypes/verify-map.cjs` (đã viết sẵn, chạy được, có 15 assertion × 3 viewport). Trỏ vào `http://localhost:3000/student/{seedStudentId}/class-map` thay vì file HTML. Giữ nguyên các helper `canvasStats`, `measureFps`, `check`.

**Phải có, chạy trên cả 3 viewport:**

| # | Assertion | Ngưỡng |
|---|---|---|
| 1 | Không lỗi console / pageerror | `0` |
| 2 | Canvas đã vẽ thật | `> 12` màu khác nhau khi lấy mẫu |
| 3 | Địa hình phủ kín khung | `> 60%` điểm mẫu khác màu nền (không có vùng trống kem) |
| 4 | Khung hình | `≥ 30fps` |
| 5 | Chữ tiếng Việt đúng | text DOM đúng **và** tỉ lệ bề rộng glyph `0.9–1.35` so với bản ASCII (bắt tofu/fallback) |
| 6 | Đúng số node | `9` marker, node cuối là boss |
| 7 | Avatar của em có mặt | đúng 1 phần tử có nhãn "EM" |
| 8 | Avatar bạn cùng lớp | số avatar `=` số bạn trong lớp seed (đúng 20, không rơi ai) |
| 9 | **Không avatar nào đè nhau** | mọi cặp bounding box giao nhau `< 40%` diện tích |
| 10 | Nhân vật đi được | giữ `KeyD` 600ms → `transform` của avatar em **đã đổi** |
| 11 | Pose đổi khi đi | `src` của `<img>` chứa `walk` khi đang đi, `idle` khi dừng |
| 12 | Bấm node → mở dialog | dialog hiện, đúng tên thử thách |
| 13 | Node locked chặn vào | nút CTA disabled / nhãn "Chưa mở" |
| 14 | Dialog nằm trong viewport | `left ≥ 0`, `right ≤ width` |
| 15 | HUD không tràn, không tự đè | 0 panel tràn, 0 cặp panel giao > 4px |
| 16 | **Mũ Shop hiện trên map** | mount với `items:[{icon:'crown',slot:'hat'}]` → có `<img src*="crown.svg">` trong node avatar của em |
| 17 | `prefers-reduced-motion` | không lỗi, không animation |
| 18 | Không có xếp hạng số trên map | **không** khớp regex `/\d+\s*\/\s*20|thứ\s*\d+/` ở bất kỳ đâu trên map (bảo vệ §6.2) |

Script phải `process.exit(1)` khi có assertion đỏ, và ghi screenshot ra `tests/__screens__/` để soi mắt được đúng thứ mà assertion đã soi.

### 10.4 Thứ tự thi công (không đảo)
| Bước | Việc | Điều kiện sang bước sau |
|---|---|---|
| A | `class-map.ts` + `class-map.test.ts` | 12 unit test xanh |
| B | `LEVELS_PER_ISLAND → 8` + sửa `islands.test.ts` + guard `sliceForLevel` | toàn bộ vitest xanh |
| C | `getClassMapData` trong `queries.ts` | log ra được data đúng cho student seed |
| D | `class-map-canvas.tsx` (chỉ địa hình + cache) | assertion 2,3,4 xanh — **fps trước khi thêm nhân vật** |
| E | Overlay avatar (em + bạn), chưa di chuyển | assertion 7,8,9,16 xanh |
| F | Di chuyển + chu kỳ walk + camera dead-zone | assertion 10,11 xanh, fps vẫn ≥30 |
| G | Dialog node + boss + điều hướng vào bài | assertion 6,12,13,14 xanh |
| H | HUD + thanh tiến độ lớp + realtime | assertion 1,15,17,18 xanh |
| I | RLS theo lớp (§11) | 2 tài khoản khác lớp không đọc chéo được |

Bước D trước E là có chủ ý: **đo fps của địa hình khi chưa có nhân vật**, để nếu tụt fps thì biết ngay là do đâu.

---

## 11. Bảo mật — làm trước khi có lớp thật

RLS trong `supabase/migrations/0002_rls_and_realtime.sql` đang **permissive cho mục đích demo**: `topic_progress` nằm trong danh sách mở, nên hiện tại **học sinh nào cũng đọc được tiến độ của học sinh khác, kể cả khác lớp, khác trường.**

Trước khi có dữ liệu trẻ em thật:
1. Policy: student chỉ `select` được `topic_progress` và `student_avatars` của các student **cùng `class_id`** với mình (join qua `enrollments`).
2. Test bằng 2 tài khoản ở 2 lớp khác nhau: em lớp A **không** đọc được tiến độ em lớp B.

Demo cho khách thì mở là được. **Lên production với học sinh thật thì đây là dữ liệu học tập của trẻ vị thành niên** — không được để mở.

---

## 12. Bẫy đã biết — đọc trước khi code, tránh mất buổi

1. **`peeps.ts` là bã.** `StudentAvatar` đã chuyển sang Kenney PNG. Đừng code theo `react-peeps`.
2. **`Robot`/`Zombie` đã bị xoá khỏi repo** nhưng vẫn còn trong mảng `CHARACTERS` → seed hash vào đó ra ảnh 404. Sửa mảng (§5.4).
3. **`ctx.font` không phải CSS font.** Sửa CSS xong chữ trên canvas vẫn lỗi dấu. Hai chỗ (§9).
4. **`grep -P` không có locale UTF-8 sẽ không khớp gì cả** và gate sẽ **báo PASS trong khi vẫn còn vi phạm**. `scripts/lint-tokens.sh` đã có `export LC_ALL=C.UTF-8` với comment — **đừng xoá dòng đó**.
5. **Đổi `left/top` mỗi frame** cho 20 avatar sẽ tụt fps. Chỉ `transform` (§8.3).
6. **`router.refresh()` từ realtime** có thể làm mất vị trí nhân vật đang đi. Phải kiểm tường minh (§6.3).
7. **`bg-black/40`, `text-white` không bị gate bắt** (regex đòi hậu tố số). Đang còn dùng đúng chỗ cho scrim modal và HUD nổi trên canvas — **giữ**. Nhưng đừng lợi dụng để lách token ở surface thường.
8. **Đừng thêm three.js.** Đã cân nhắc và loại: +600KB–1MB JS cho học sinh dùng data di động, WebGL trên driver GPU máy yếu, và không giải quyết vấn đề nào mà canvas 2D chưa giải quyết. Cheppy — đối thủ tham chiếu trong `cheppy-competitive-analysis.md` — cũng là 2D.

---

## 13. Định nghĩa HOÀN THÀNH

- [ ] `npm run verify` xanh (lint:tokens 3 rule PASS + vitest, 115 test cũ + ~12 test mới)
- [ ] `npm run build` thành công
- [ ] `node tests/class-map.spec.cjs` — 18 assertion × 3 viewport, exit 0
- [ ] `npm run dev` → mở `/student/{id}/class-map` thật sự thấy bản đồ, không phải file HTML rời
- [ ] Nhân vật của em đi được bằng WASD (desktop) và kéo (mobile), có chu kỳ walk
- [ ] Mua 1 mũ ở `/shop` → mũ hiện trên nhân vật ở `/class-map` không cần refresh
- [ ] 20 bạn cùng lớp hiện đúng theo `topic_progress`, không ai bị đè, không ai bị mất
- [ ] 1 bạn hoàn thành thử thách → avatar bạn đó dịch node trên máy em trong ≤2s, có animation
- [ ] 9 node: 8 thử thách + 1 trùm cuối, node locked có then cửa, bấm vào vẫn xem được
- [ ] Không có bất kỳ xếp hạng số nào trên bản đồ
- [ ] ≥30fps trên cả 3 viewport
- [ ] Đã mở trên **1 iPhone thật** và soi nhãn `.st-mono` có dấu (§9)
