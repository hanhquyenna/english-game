# Beeblast — FRS World Skin (Kenney assets) v1 (bản chốt để giao Antigravity)

Đọc trực tiếp source code đang chạy (`src/app/student/[studentId]/page.tsx`, `src/components/student/island-band.tsx`, `buddy-pet-widget.tsx`, `student-shell.tsx`) đối chiếu với ảnh chụp màn hình Learn thật — không đoán. Tài sản đồ hoạ (`kenney_tiny-town.zip`, `kenney_toon-characters.zip`, license CC0) đã được giải nén và copy sẵn vào repo tại `public/kenney/` (đã cắt bớt Robot/Zombie và bản HD/Vector không dùng tới, còn ~2.8MB — xem mục 1).

---

## 0. Vì sao màn hình hiện tại "yếu, rời rạc, không có chiều sâu" — chẩn đoán cụ thể, không chung chung

Đối chiếu ảnh chụp Learn page với đúng source code sinh ra nó:

1. **Emoji rời rạc đè lên design system đã định nghĩa nghiêm ngặt.** `page.tsx` dòng 3 import sẵn `BookOpen, Mic, RotateCcw, Target` từ `lucide-react` — nhưng KHÔNG dùng, thay vào đó dòng 64/98/113/128 hardcode `<span className="text-2xl">🐝</span>`, `🎙️`, `🎯`, `📚` trực tiếp trong JSX. Đây đúng loại lỗi mà `Beeblast_FIX_DesignSystem_ClassPicker_KidUX_v1.md` đã cảnh báo (dùng thứ ngoài hệ thống thay vì token/thư viện đã có) — chỉ khác là lần này là emoji thay vì màu Tailwind mặc định. Emoji render khác nhau tuỳ hệ điều hành/font, không đồng bộ nét vẽ với `lucide-react` đang dùng ở mọi nơi khác (header, bottom nav, IslandBand) → đây là lý do trực quan lớn nhất khiến 3 thẻ Role Play/Ôn luyện/Thư viện và khối Pet nhìn "lạc quẻ".
2. **Bee xuất hiện 2 lần cạnh nhau, thừa và không có lý do.** Level card dùng 🐝 ở dòng 64, `BuddyPetWidget` (`buddy-pet-widget.tsx` dòng 14) dùng lại đúng 🐝 đặt sát bên phải cùng 1 khối màu — 2 con ong giống hệt nhau trong cùng 1 khung nhìn, không phân biệt được "linh vật cấp độ" với "thú cưng đồng hành" là 2 khái niệm khác nhau (xem FRS Cheppy Game Loop v1 mục C5: pet phải là 1 thực thể riêng, có thể tiến hoá, khác linh vật thương hiệu chung).
3. **Đường đi (path) chỉ là 1 cột tròn thẳng đứng, không phải 1 "nơi chốn".** `island-band.tsx` có sẵn logic uốn (dòng 132: `translateX(Math.sin(i * 0.85) * 38)`) nhưng biên độ 38px quá nhỏ so với bề rộng thẻ, cộng với nền là màu phẳng token (`ISLAND_TINTS`) chứ không phải khung cảnh minh hoạ — kết quả nhìn vẫn là các hình tròn xếp dọc trên nền màu trơn, không có cây, đường mòn, toà nhà như Cheppy. Đây là khoảng cách lớn nhất so với Cheppy: Cheppy không có gì đặc biệt về logic, chỉ đơn giản là MỌI điểm dừng đều có bối cảnh minh hoạ xung quanh nó.
4. **Không có nhân vật/hoá thân nào di chuyển trên đường.** `StudentAvatar` (Open Peeps) chỉ xuất hiện tại đúng 1 node "You are here" dạng icon tĩnh 30px kèm chữ — không phải một nhân vật "đứng" trên khung cảnh, không có tương tác, không có phản ứng (vui/buồn) khi đúng/sai — trong khi Cheppy dùng linh vật với hàng chục pose để phản hồi CẢM XÚC ở mọi bước.
5. **Nút "PET" là 1 pill nổi lệch trong header, không thuộc bố cục nào.** `page.tsx` dòng 76-78 đặt `BuddyPetWidget` trong `<div className="text-right">` đối xứng với khối tiêu đề cấp độ bên trái — về layout thì đúng lưới, nhưng về mặt hình ảnh nó là 1 khối riêng biệt hoàn toàn (viền, nền, icon khác hẳn phần còn lại của level card) → cảm giác "dán thêm vào sau", đúng như anh nhận xét "không kết nối".

**Kết luận chẩn đoán**: đây không phải lỗi code (mọi thứ chạy, mọi route tồn tại theo đúng FRS trước) — đây là lỗi ĐẠO DIỄN HÌNH ẢNH (art direction). Cheppy hơn không phải vì cơ chế phức tạp hơn, mà vì MỌI bề mặt đều được vẽ minh hoạ nhất quán (làng, nhân vật, mascot phản ứng) thay vì ghép icon/emoji rời rạc lên khung UI chuẩn. Tài liệu này sửa đúng chỗ đó — thay khung UI phẳng bằng khung cảnh minh hoạ dùng bộ tài sản Kenney, KHÔNG động vào business logic/data đã chạy đúng.

---

## 1. Tài sản & phạm vi

**Đã copy sẵn vào repo, dùng thẳng qua đường dẫn tĩnh Next.js (`/kenney/...`), không cần build thêm bước nào:**

| Đường dẫn | Nội dung | Dùng cho |
|---|---|---|
| `public/kenney/tiny-town/Tiles/tile_0000.png` … `tile_0131.png` | 132 tile rời 16×16, pixel art | Nền cỏ/đường mòn, cây, tường đá/gạch, mái, cửa, rương, công cụ — xem bảng tile mục 3 |
| `public/kenney/tiny-town/Tilemap/tilemap_packed.png` | Bản sheet đóng gói 192×176 | Dự phòng nếu sau này chuyển sang render bằng sprite-sheet thay vì tile rời |
| `public/kenney/tiny-town/License.txt` | CC0 1.0 | Giữ nguyên file license trong repo, không xoá |
| `public/kenney/toon-characters/{Female adventurer, Female person, Male adventurer, Male person}/PNG/Poses/*.png` | Mỗi nhân vật 45 pose (idle, walk0-7, talk, think, cheer0/1, hurt, jump, climb, interact...) | Nhân vật hướng dẫn (NPC) xuất hiện trong story popup — xem mục 4.4 |
| `.../PNG/Parts/*.png` | Linh kiện rời (head/body/arm/leg…) | CHƯA dùng ở v1 — để dành nếu sau này build tuỳ biến NPC theo lớp học |
| `.../Tilesheet/character_*_sheet.png` + `.xml` | Atlas + toạ độ từng pose | Dùng nếu chuyển sang render canvas/sprite-atlas thay vì `<img>` rời — v1 dùng `<img>` rời cho đơn giản |
| `public/kenney/toon-characters/License.txt` | CC0 1.0 | Giữ nguyên |

**Đã CHỦ ĐỘNG bỏ khỏi repo** (không phù hợp bối cảnh làng quê ấm/trẻ tiểu học, hoặc thừa dung lượng): 2 bộ nhân vật `Robot` và `Zombie`, toàn bộ thư mục `Parts HD`/`Poses HD` (bản độ phân giải cao không cần cho icon nhỏ) và `Vector` (SVG nguồn, không cần lúc runtime). Nếu sau này cần silhouette vector để chỉnh sửa, lấy lại từ file zip gốc, không cần thêm vào repo.

**KHÔNG đụng vào**: hệ thống avatar học sinh hiện có (`react-peeps`, bảng `avatars`/`student_avatars`, route `/shop`, `/avatar`). `toon-characters` KHÔNG thay thế avatar học sinh — 2 hệ tồn tại song song với vai trò khác nhau (xem mục 2.2). Đây là quyết định thiết kế bắt buộc, không phải tuỳ chọn — tránh có 2 hệ thống tuỳ biến nhân vật cạnh tranh nhau trong cùng 1 app.

---

## 2. Nguyên tắc thiết kế bắt buộc (áp dụng toàn bộ mục 4)

**2.1 Cấm ký tự emoji trong mọi JSX của app Học sinh, không ngoại lệ**
Quét bắt buộc trước khi merge: `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/app/student src/components/student` phải trả về rỗng. Mọi icon dùng `lucide-react` (đã có sẵn, đã import ở nhiều nơi) hoặc tile Kenney tương ứng — không dùng emoji hệ điều hành làm icon UI.

**2.2 Phân vai rõ giữa 2 hệ nhân vật, không trộn**
- `react-peeps` (avatar hiện có) = **danh tính học sinh** — hiện ở header, node "You are here" trên đường đi, Profile, Shop. Không đổi.
- `toon-characters` (Kenney, mới) = **NPC hướng dẫn/mascot phản hồi** — không đại diện học sinh, chỉ xuất hiện trong: story popup khi mở 1 khu/toà nhà, màn phản hồi đúng/sai, màn chờ trong Role Play/Practice/Library. Học sinh không tuỳ biến được NPC này.

**2.3 Mọi bề mặt "thế giới" (Learn path) dùng tile Kenney; mọi bề mặt "biểu mẫu" (Practice runner, forms, danh sách) giữ nguyên token `st-*` hiện có**
Không kenney-hoá toàn bộ app — chỉ khu vực bản đồ/khám phá (Learn page + entry points) đổi sang khung cảnh minh hoạ, giống cách Cheppy chỉ vẽ minh hoạ ở "World map" còn màn làm bài vẫn là UI chuẩn.

---

## 3. Bảng tile Kenney → ý nghĩa (tra cứu bắt buộc khi code, tránh đoán chỉ số)

| Index | Vai trò | Index | Vai trò |
|---|---|---|---|
| `tile_0000` | Cỏ nền | `tile_0041` | Đường mòn (path) |
| `tile_0015` | Cây (mùa thu) | `tile_0016` | Cây (xanh) |
| `tile_0029` | Nấm trang trí | `tile_0044-0047` | Hàng rào gỗ |
| `tile_0048-0051` | Tường đá (+ cửa sổ) | `tile_0052-0055` | Tường gạch đỏ (+ cửa sổ) |
| `tile_0063` | Mái đá (tam giác) | `tile_0067` | Mái gạch (tam giác) |
| `tile_0074, 0084-0091` | Cửa gỗ (nhiều biến thể) | `tile_0094` | Tổ ong (khớp linh vật Ong sẵn có) |
| `tile_0093` | Đá quý | `tile_0106/0107` | Rương đóng/mở |
| `tile_0096-0125` | Tường/nền/cổng lâu đài (đá xám, có chấn song) | `tile_0043` | Nền đá lát |

Bản đồ demo tương tác đã dựng thử (4 loại toà nhà, dùng đúng các tile trên) đã gửi trong hội thoại trước — dùng làm tài liệu tham chiếu hình ảnh, KHÔNG phải code để copy nguyên, vì bản demo dùng ảnh rời phóng to 24-30px còn bản thật nên dùng kích thước lưới nhất quán theo mục 4.

---

## 4. Đặc tả từng thay đổi

### 4.1 Level card (`page.tsx` dòng 58-89) — bỏ emoji, thêm bối cảnh
- Thay `<span className="text-2xl">🐝</span>` bằng 1 `<img src="/kenney/tiny-town/Tiles/tile_0094.png">` (tổ ong) phóng to `image-rendering: pixelated`, đặt trong khung tròn nền `var(--st-accent)` để không bị vỡ nét trên nền primary đỏ cam hiện tại.
- **Test**: ảnh tổ ong không bị mờ/nhoè ở mọi độ phân giải màn hình (kiểm tra 1x/2x/3x DPI), fallback icon `lucide` (`Sparkles` hoặc tương đương) nếu ảnh lỗi 404, không được hiện ô vỡ ảnh trần trụi.

### 4.2 Buddy Pet Widget (`buddy-pet-widget.tsx`) — tách khỏi level card, có bản sắc riêng
- Bỏ hẳn khỏi vị trí "text-right" trong level card. Chuyển thành 1 khối riêng, dạng "chuồng thú cưng" nhỏ neo cố định ở góc dưới-phải của TOÀN BỘ Learn page (không nằm trong Tile màu primary nữa) — dùng tile hàng rào (`0044-0047`) làm viền khung mini + ảnh con thú hiện tại của học sinh (đọc từ `student_pets.stage`, đã có ở FRS Cheppy Game Loop v1 mục C5) thay vì luôn luôn là 🐝 tĩnh.
- Nếu chưa tới bảng `student_pets` (pet chưa tồn tại) → hiện đúng placeholder skeleton (không phải spinner vô hạn — nhắc lại nguyên tắc 0.3 của FRS trước).
- **Test**: pet stage 1/2/3 hiện đúng hình khác nhau; widget không đè lên nội dung cuộn bên dưới; tap vẫn dẫn đúng route `/pet` như cũ.

### 4.3 3 thẻ Quick Action (Role Play / Ôn luyện / Thư viện, `page.tsx` dòng 92-137)
- Xoá `🎙️`, `🎯`, `📚`. Dùng ĐÚNG các icon `lucide-react` đã import sẵn nhưng chưa dùng: `Mic` cho Role Play, `Target` cho Ôn luyện, `BookOpen` cho Thư viện — 0 chi phí thêm, chỉ là gắn đúng thứ đã có sẵn trong file.
- Thêm 1 dải nền tile cỏ/đường (`tile_0000`/`tile_0041` lặp lại, cao ~24px) phía dưới 3 thẻ để 3 thẻ trông như "3 cổng vào" đứng trên cùng 1 con đường dẫn xuống khu vực Island bên dưới — tạo cảm giác liền mạch giữa "quick actions" và "learning path" thay vì 2 khối tách rời như hiện tại.
- **Test**: cả 3 nút vẫn điều hướng đúng route cũ (`/roleplay`, `/practice`, `/library`) — đổi icon/nền không được phá logic `Link` hiện có; ẩn đúng khi feature flag tắt (`showRolePlay/showPractice/showLibrary`).

### 4.4 IslandBand — biến "cột tròn" thành "khung cảnh làng"
Đây là thay đổi lớn nhất, áp dụng cho `island-band.tsx`:
- Thay nền phẳng `ISLAND_TINTS` bằng nền lặp tile cỏ (`tile_0000`, xen `tile_0001/0002` ngẫu nhiên theo `index` của node để đỡ đều răm rắp), có 1 dải đường mòn (`tile_0041`) chạy dọc theo đúng toạ độ `translateX(sin(i*0.85)*38)` đã có sẵn — TĂNG biên độ lên tối thiểu 56px (từ 38px) để độ uốn rõ hơn, và path phải là hình ảnh thật vẽ dưới chân các node, không chỉ là khoảng trắng.
- Mỗi node giữ nguyên logic trạng thái hiện có (`active/done/locked`, icon `Check/Lock/Star/Award`) nhưng bọc trong 1 "trạm dừng" nhỏ dùng tile Kenney theo loại: node thường = cụm cây (`0015`/`0016`) + biển gỗ nhỏ; node thi (`isExam`) = 1 toà nhà mini (tường `0048` + mái `0063` + cửa `0084`, đúng bảng mục 3) để phân biệt trực quan với node thường — hiện tại `isExam` chỉ khác ở icon `Award` và bo góc 14px, không đủ nổi bật.
- **Nhân vật đi trên đường thay vì icon tĩnh "You are here"**: dùng `toon-characters` idle/walk pose (không phải react-peeps — vì react-peeps không có pose đi bộ) đặt tại đúng vị trí node hiện tại, CÙNG với avatar Peeps nhỏ hơn cạnh bên để vẫn giữ danh tính học sinh — tách rõ 2 vai trò theo mục 2.2 (character NPC = trang trí "đang khám phá", Peeps = "đây là con của bạn/chính bạn").
- **Test**: sine-wave path hiển thị rõ bằng mắt thường ở màn hình 375px (không chỉ đúng số học); node exam phân biệt được với node thường trong <1 giây nhìn; nhân vật walk-pose không đè lên icon trạng thái node; tất cả `Link` điều hướng cũ (`/practice/{topicId}?level=`, `/challenges?tab=exam`) không đổi.

### 4.5 Story popup dùng chung cho Role Play / Practice / Library (mới, tái dùng 1 component)
Tạo 1 component `<KenneyStoryDialog>` dùng chung, nhận props `{ npcPose: string, title, body, ctaLabel, onCta }` — thay cho việc mỗi màn tự vẽ hộp thoại riêng:
- Ảnh NPC (`toon-characters` pose `talk`/`think`/`cheer0` tuỳ ngữ cảnh: `talk` khi giới thiệu nhiệm vụ, `cheer0` khi đúng, `hurt` khi sai) đặt bên trái hoặc trên, khung thoại bên phải/dưới dùng đúng `Tile` + token `st-*` hiện có — KHÔNG vẽ khung thoại kiểu mới, chỉ thay icon/ảnh minh hoạ bên trong khung đã chuẩn.
- Áp dụng lại đúng component này ở: màn "Correct/Wrong" hiện có trong exercise runner (hiện đang dùng gì thì thay bằng component này để đồng bộ), màn giới thiệu topic Role Play, màn "hết kho lỗi sai" trong Practice.
- **Test**: 1 component dùng ở ≥3 chỗ, đổi 1 lần sửa cả 3 nơi (kiểm bằng cách đổi thử `npcPose` ở 1 nơi và xác nhận không lan sang chỗ khác ngoài ý muốn — tức là props hoạt động độc lập đúng).

---

## 5. UX/UI professional review — checklist bắt buộc tự chấm trước khi báo Done

Không chỉ "chạy được" — phải tự chấm theo đúng 5 tiêu chí sau, ghi lại kết quả (pass/fail + ảnh chụp) cho từng mục, không được bỏ qua mục nào:

1. **Nhất quán thị giác (Consistency)**: mọi icon trong 1 màn hình đến từ CÙNG 1 nguồn (toàn `lucide` HOẶC toàn tile Kenney trong khu World, không trộn emoji). Chạy lại grep ở mục 2.1.
2. **Phân cấp thị giác (Hierarchy)**: nhìn thoáng qua 2 giây, người dùng phải biết ngay đâu là hành động chính của màn hình (nút to nhất/màu primary) — chụp ảnh, che các phần phụ, hỏi 1 người ngoài dự án "bấm vào đâu đầu tiên" để xác nhận, không tự đánh giá chủ quan.
3. **Phản hồi tức thời (Feedback)**: mọi tap đều có phản hồi trong <100ms (đổi màu/scale nhẹ — component hiện có đã làm `active:scale-95`, giữ nguyên, không được mất khi thêm ảnh Kenney đè lên).
4. **Không có phần tử "mồ côi"** — mọi khối trên màn hình phải liên kết bằng đường dẫn/nền/viền tới ít nhất 1 khối khác (đúng nguyên nhân gốc mục 0.5 — nút Pet nổi lệch). Sau khi sửa, kiểm bằng cách hỏi: "khối này đứng 1 mình được không hay bắt buộc phải nhìn cùng khối bên cạnh mới hiểu?" — nếu đứng 1 mình được nghĩa là chưa kết nối đủ.
5. **Độ tương phản & khả năng đọc**: text đặt trên ảnh tile Kenney (vd nhãn tên node) phải qua kiểm WCAG AA tối thiểu (dùng nền `rgba(255,255,255,0.85)` bo góc phía sau chữ như bản demo, không đặt chữ trực tiếp lên ảnh pixel không có lớp nền).

---

## 6. QA chức năng — bắt buộc chứng minh MỌI nút hoạt động thật, không chỉ nhìn đẹp

Đây là yêu cầu riêng, tách khỏi UX review ở mục 5. Với MỌI phần tử bấm được trên Learn page (và các màn liên quan bị đổi ở mục 4), lập bảng sau, điền cột "Kết quả" bằng cách bấm thật (không đọc code suy luận), đính kèm ảnh chụp trước/sau khi bấm:

| Phần tử | Hành vi mong đợi | Cách xác minh |
|---|---|---|
| Avatar header | Mở `/account` | Bấm thật, xác nhận URL đổi + màn Account load đúng học sinh |
| Streak (🔥→icon Flame) | Không bấm được (chỉ hiển thị) | Xác nhận KHÔNG có `href`/`onClick` gắn nhầm gây điều hướng lạ |
| Inbox | Mở `/inbox`, badge đúng số tin chưa đọc | Bấm thật; đổi trạng thái đã đọc → badge giảm đúng, không cache số cũ |
| Gems | Mở `/shop` | Bấm thật, số gems ở Shop khớp số ở header (cùng nguồn dữ liệu) |
| Pet widget | Mở `/pet`, không màn trắng/spinner vô hạn | Bấm thật, đợi đủ 8s theo quy tắc 0.3 của FRS trước |
| Role Play card | Mở `/roleplay` | Bấm thật, xác nhận danh sách topic load được |
| Ôn luyện card | Mở `/practice` | Bấm thật, xác nhận 2 lựa chọn Mistake Review/Skill Boost hiện đúng |
| Thư viện card | Mở `/library` | Bấm thật, kệ sách load được ảnh bìa |
| Mỗi node bài học (Lesson 1-4...) | `done` → xem lại; `active` → vào làm; `locked` → không bấm được | Bấm cả 3 trạng thái, xác nhận đúng hành vi từng loại, không phải chỉ test node đầu tiên rồi suy ra các node còn lại |
| Node thi (exam) | Mở `/challenges?tab=exam` | Bấm thật |
| Bottom nav 5 mục | Đổi đúng trang + đúng icon active | Bấm lần lượt cả 5, xác nhận trạng thái active chỉ sáng đúng 1 mục tại 1 thời điểm |

**Điều kiện Done cho mục 6**: bảng trên phải điền đủ, không được để trống hay ghi "chắc là đúng" — nếu 1 dòng chưa bấm thử thật thì coi như chưa xong, không được báo cáo hoàn thành.

---

## 7. Test tự động + lệnh bắt buộc chạy trước khi báo Done

1. `npm run lint` — 0 lỗi.
2. Grep cấm emoji (mục 2.1) — phải rỗng.
3. Grep cấm màu ngoài token (đã có từ FIX_DesignSystem, chạy lại vì file mới thêm cũng phải tuân thủ): `grep -rn "slate-\|sky-\|rose-\|amber-\|emerald-\|zinc-\|gray-" src` — rỗng.
4. `npm run build` — build production không lỗi (ảnh tĩnh trong `public/kenney` phải được Next.js phục vụ đúng, kiểm bằng cách mở trực tiếp 1 URL ảnh vd `/kenney/tiny-town/Tiles/tile_0000.png` sau khi `npm run start` và xác nhận trả về ảnh, không phải 404).
5. `npm run test` — không có test nào vỡ do đổi `island-band.tsx`/`page.tsx` (nếu có test cũ tham chiếu cấu trúc DOM cũ, cập nhật test theo cấu trúc mới, không xoá test để né lỗi).
6. Test tay đầy đủ theo bảng mục 6 + checklist mục 5, ở cả ~375px và ~1440px.

---

## 8. Dependency map

1. Mục 4.1/4.2/4.3 độc lập nhau, làm song song được.
2. Mục 4.4 (IslandBand) phải làm SAU 4.3 vì dải tile nối 2 khu vực nên cần thống nhất chiều cao/nhịp lặp tile giữa 2 mục.
3. Mục 4.5 (`KenneyStoryDialog`) phải làm trước khi áp dụng vào Role Play/Practice/Library — dựng component dùng chung trước, tránh code trùng lặp ở 3 nơi rồi phải sửa lại 3 lần.
4. Không đổi bất kỳ file trong `src/lib/queries.ts`, `src/lib/islands.ts`, hay bảng Supabase nào — mục này thuần về trình bày (presentation layer), dữ liệu/logic nghiệp vụ giữ nguyên 100% như FRS trước đã chốt.

---

## 9. Ghi chú bàn giao

Tài sản đã nằm sẵn trong repo tại `public/kenney/` (mục 1), không cần Antigravity tự tải/giải nén gì thêm. Đây là thay đổi thuần trình bày (UI/UX), không đổi schema, không đổi route, không đổi business rule — an toàn để làm độc lập với các FRS backend trước đó. Trọng tâm bàn giao: (1) bỏ emoji, dùng đúng icon đã import sẵn nhưng bị bỏ quên — sửa nhanh nhất, làm trước; (2) IslandBand là phần tốn công nhất, nên làm sau khi 2 mục dễ đã ổn để có "quick win" trước; (3) mục 5 và 6 (review UX + QA chức năng) là điều kiện Done bắt buộc, không phải optional — báo cáo hoàn thành phải kèm bảng đã điền ở mục 6 và kết quả 5 tiêu chí ở mục 5, không chỉ nói "đã xong".
