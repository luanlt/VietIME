# Quyết định về các ví dụ Telex

Các fixture giữ quy tắc Telex và case đầu vào; không thêm autocorrect ngầm.

| Ví dụ trong yêu cầu | Vấn đề | Input chuẩn được test |
|---|---|---|
| ddienj -> điện | Thiếu e tạo ê | ddieenj -> điện |
| duwowngf -> đường | Thiếu d tạo đ | dduwowngf -> đường (dduowngf cũng theo rule ươ) |
| nguyenx -> nguyễn | Thiếu e tạo ê | nguyeenx -> nguyễn |
| nguyeenx -> Nguyễn | Không có N hoa | Nguyeenx -> Nguyễn |

Tên tùy chọn Modern tone placement được giữ theo brief; giá trị mặc định ưu tiên ví dụ **hóa, thúy**, OFF là **hoá, thuý**. Đây là định nghĩa bằng ví dụ của sản phẩm, không khẳng định nhãn này thống nhất với mọi bộ gõ.

Repeated tone: khi bật **Auto-detect English words** (mặc định), gõ lặp phím dấu trả lại đúng phím đã gõ (ass -> ass, boss -> boss, tests -> tests) theo yêu cầu gõ tiếng Anh trong chế độ VI (2026-09-25); tắt tùy chọn này để giữ hành vi cũ ass -> a, aff -> a. Modifier undo: aaa -> aa; không mặc định hành vi trả lại đầy đủ raw aaa. Case lấy từ Unicode của sự kiện, không tự bật chữ hoa đầu câu.

Backspace khi đang gõ tiếng: tiếng -> tiến -> tiế -> tí -> t -> rỗng. Đây là xóa chữ hiển thị cuối và tính lại vị trí tone, không undo một raw keystroke. Sau commit, editor xử lý Backspace.

Giới hạn phân biệt ngôn ngữ: `as` có thể là từ tiếng Anh hoặc Telex cho á. Không có cách xác định mọi trường hợp chỉ từ prefix. Bypass dựa editor type, cấu trúc URL/email và chế độ EN là hành vi có chủ đích; không tuyên bố tự giữ nguyên mọi code/URL khi VI bật.

## Nhận diện tiếng Anh (2026-09-25)

Mỗi phím, engine kiểm tra chuỗi chữ còn có thể thành âm tiết tiếng Việt không (phụ âm đầu, nguyên âm có thể thêm dấu mũ/móc, phụ âm cuối; `Syllable.isViablePrefix`). Không thể thì token chuyển sang literal ngay, hiện đúng phím đã gõ tới hết từ: project, class, windows, search, default. Đây là kiểm tra cấu trúc, không phải từ điển.

Từ vừa đúng cấu trúc tiếng Việt vừa là tiếng Anh (test -> tét) dùng danh sách từ, chỉ xét **ở cuối từ** để không chặn tiền tố tiếng Việt (meet -> meet nhưng meetj -> mệt). Danh sách mặc định loại các cách gõ thông dụng (rét, lít, Mĩ, mã, tên); người dùng thêm từ trong Settings. Telex `w` khi chưa có nguyên âm là `ư` (nhw -> như), `ww` -> `w`.

## Hành vi kiểu UniKey (2026-09-26, bản 1.0.4)

Tái hiện theo hành vi quan sát được của UniKey Telex, không dùng mã nguồn UniKey (GPL):

- **Gõ trực tiếp không gạch chân** (mặc định BẬT, "Gõ kiểu UniKey"): mọi editor nhận chữ ngay, mỗi phím chỉ xóa/ghi lại phần khác biệt của từ đang gõ. TẮT để dùng pre-edit gạch chân ở editor hỗ trợ.
- **d ở bất kỳ vị trí nào** biến d đầu từ thành đ nếu từ vẫn có thể là tiếng Việt: dinhd → đinh, dieend → điên; gõ d lần nữa để hoàn tác (didd → did). Từ không phải tiếng Việt không bị đổi (add, odd, dead).
- **Lặp phím dấu**: tùy chọn "Gõ lặp phím dấu kiểu UniKey" (mặc định TẮT) cho ass → as, tieengss → tiêngs. Mặc định giữ nguyên phím đã gõ (ass → ass, boss → boss) để tiện gõ tiếng Anh.

## Phím ký hiệu, gõ dấu lần ba, tự viết hoa, gõ tắt (sau 1.0.4)

- **Phím số và ký hiệu do hệ thống gõ.** Trước đây VietIME tự ghi ký tự lấy từ `KeyEvent.unicodeChar`. Trên HarmonyOS PC, giá trị này có thể khác với ký tự in trên phím (người dùng gặp phím `=` ra `+`, phải thêm Shift mới ra `=`), trong khi bàn phím Celia và các ô nhập khi không có IME đều gõ đúng. Giờ với phím không phải chữ cái hay khoảng trắng, engine trả `passKey`: session ghi xong từ đang gõ (hoặc khôi phục phím thô với URL/biểu thức), rồi trả sự kiện phím về chưa xử lý để editor gõ ký tự theo bố cục bàn phím của hệ thống. Ở chế độ gõ trực tiếp, vị trí con trỏ tính toán được cộng thêm độ dài ký tự đó. Bản debug ghi `code`/`unicodeChar` của phím ký hiệu (không ghi chữ cái, chữ số) để đối chiếu trên máy. Tắt được bằng "Để hệ thống gõ số và ký hiệu".
- **Gõ dấu lần thứ ba bị bỏ qua.** Khi nhận diện tiếng Anh đang bật, `off` → `off` (khôi phục phím thô). Thói quen UniKey là gõ thêm một phím dấu nữa để bỏ dấu (`offf`), trước đây cho ra ba chữ f. Phím dấu giống hệt, gõ ngay sau lần khôi phục, giờ bị nuốt: `offfice` → `office`, `asss` → `ass`.
- **Tự viết hoa** chỉ dựa trên chuỗi phím của chính phiên gõ, không đọc văn bản trong ô nhập: sau `. ! ?` (có thể kèm dấu đóng ngoặc/nháy), rồi dấu cách hoặc Enter, chữ cái thường đầu tiên được viết hoa nếu con trỏ vẫn ở chỗ cũ. Click chuột, phím điều hướng, Backspace hoặc tổ hợp Ctrl/Alt sẽ hủy trạng thái này. Tùy chọn viết hoa ở đầu ô nhập (con trỏ ở vị trí 0) mặc định TẮT vì gây khó chịu trong Excel và ô tìm kiếm. Tự viết hoa chỉ áp dụng ở chế độ tiếng Việt.
- **Gõ tắt** được so khớp ở cuối từ (dấu cách, dấu câu, Enter) theo chuỗi phím đã gõ, không phân biệt hoa thường. Kết quả theo kiểu chữ đã gõ (`vn`, `Vn`, `VN`). Token đang là tiền tố của một từ viết tắt không bị chuyển sang tiếng Anh giữa chừng. Token kỹ thuật (URL, `/`, `=`, chữ số) không được mở rộng.

## Việt / Anh theo ứng dụng (1.0.7)

- **Nhận diện ứng dụng** bằng `EditorAttribute.bundleName` lúc `inputStart`. Liệt kê ứng dụng đã cài cần quyền `GET_BUNDLE_INFO_PRIVILEGED` (chỉ ứng dụng hệ thống), nên Cài đặt cho chọn từ các ứng dụng VietIME đã gõ gần đây (tối đa 30, chỉ ghi khi tính năng bật) hoặc nhập mã ứng dụng. Tên hiển thị chỉ có sẵn cho vài ứng dụng quen thuộc; còn lại hiện bundle ID.
- **Quy tắc:** ứng dụng đã chọn luôn bắt đầu ở Ví/EN của nó. Chuyển tay trong ứng dụng đó chỉ giữ tới khi sang ứng dụng khác. Đổi ô nhập trong cùng ứng dụng không bao giờ chuyển chế độ. Ứng dụng chưa chọn dùng chế độ chuyển tay gần nhất bên ngoài các ứng dụng đã chọn, hoặc (tùy chọn *tự nhớ*) chế độ dùng lần trước trong chính ứng dụng đó.
- **EasyAbroad** báo cùng một bundle (`com.easy.hmos.abroad`) cho mọi ứng dụng Android, nên chúng dùng chung một thiết lập — đúng như yêu cầu.
- Dữ liệu per-app do tiến trình IME ghi vào file Preferences riêng (`vietime_apps_v1`), ghi trễ 2 giây và không bao giờ trên đường xử lý phím; snapshot cài đặt vẫn do trang Cài đặt sở hữu.
- **Quy tắc có sẵn** (`presetCategory`): bundle ID cụ thể đã thấy trên MateBook (HiShell, Hish, TermNext, WPS, Pure Office, trình duyệt Huawei, Celia, EasyAbroad), sau đó so từng phần của bundle ID với từ khóa (terminal/shell/ssh → EN; AI, trình duyệt, văn phòng → Ví). Thứ tự ưu tiên: quy tắc người dùng > quy tắc có sẵn > chế độ tự nhớ > chế độ dùng chung.

## Nhận diện tiếng Anh (1.0.7)

- **Dấu và phụ âm cuối tắc:** vần đóng bằng `c ch p t` chỉ có dấu sắc hoặc nặng. Dấu huyền/hỏi/ngã với phụ âm cuối tắc được coi là tiếng Anh ngay khi gõ (`port`, `texts`) và bị khôi phục ở cuối từ khi *khôi phục từ sai* bật.
- **Danh sách từ phiên bản 2** thêm các từ mà cách đọc Telex là âm tiết hiếm (`is` → í, `data` → dât). Âm tiết thông dụng bị loại có chủ ý (`this` → thí, `its` → ít, `max` → mã, `did` → đi). Danh sách đã lưu nhận các từ mới đúng một lần (`englishListVersion`); từ người dùng xóa sau đó không quay lại.

## Hủy dấu kiểu UniKey trong từ tiếng Anh (2026-09-27)

- **`ww` / `aaa` / `ddd` không còn tắt nhận diện tiếng Anh.** Gõ `w` đầu từ hiện `ư`; người quen UniKey gõ thêm `w` để về `w`. Trước đây token đã hủy (`escaped`) bỏ qua nhận diện tiếng Anh, nên `wwindows` thành `wíndow`, gõ thêm `s` để bỏ dấu thì khôi phục cả chuỗi phím thô: `wwindowss`. Giờ token đã hủy vẫn được kiểm tra, và khi chuyển sang tiếng Anh chỉ trả lại phím đã gõ trừ phím dùng để hủy (`plain`): `wwindows` → `windows`, `wword` → `word`, `Wwindows` → `Windows` (giữ chữ hoa của `Ư`). Gõ thẳng `windows` vẫn ra `windows`.

## Gõ liền hai lần phím dấu bỏ dấu như UniKey / OpenKey (2026-09-27)

- **Thay đổi mặc định:** phím dấu gõ **liền** hai lần bỏ dấu và giữ một phím: `oss` → `os`, `ass` → `as`, `tieengss` → `tiêngs`, `osss` → `oss`. Trước đây (1.0.7) cho ra đúng phím thô `oss`, trái thói quen UniKey/OpenKey. Mục 14 và 32 ở trên được thay bằng quy tắc này.
- **Từ tiếng Anh vẫn giữ nguyên:** nếu sau cặp phím dấu còn gõ thêm chữ cái, từ được coi là tiếng Anh và trả lại phím đã gõ: `office`, `error`, `message`, `current`, `coffee`; `offfice` → `office` (phím thứ ba bị bỏ). Phím dấu lặp **không liền nhau** vẫn khôi phục phím thô: `tests`, `posts`.
- **Từ kết thúc bằng phím dấu gõ đôi** (`boss`, `less`, `miss`, `kiss`, `pass`, `loss`, `toss`, `mass`, `off`) nằm trong danh sách từ phiên bản 3 và giữ nguyên ở cuối từ; người dùng xóa được trong Settings. Danh sách đã lưu nhận các từ này đúng một lần.
- Tùy chọn cũ "Gõ lặp phím dấu kiểu UniKey" đổi tên thành "Luôn bỏ dấu khi gõ lại phím dấu": BẬT thì phím dấu lặp ở cuối từ cũng bỏ dấu (`tests` → `tets`).
- **Bỏ dấu giữa từ (bổ sung):** chữ gõ sau cặp phím dấu quyết định cách hiểu. **Nguyên âm** → phụ âm đôi tiếng Anh, trả lại phím đã gõ (`office`, `error`, `lesson`). **Phụ âm** → thói quen UniKey bỏ dấu giữa từ, giữ dạng đã bỏ dấu (`tesst` → `test`, `cosst` → `cost`, `texxt` → `text`). Hệ quả: gõ tự nhiên `offline` sẽ ra `ofline` như UniKey, trừ khi từ nằm trong danh sách (đã thêm `offline`, `offset`, `password`, `passport`).

## Tự thêm dấu mũ theo dấu thanh (1.0.9)

- **Nguồn:** `engine/promotion.c` của GoTiengViet. Khi âm tiết có dấu thanh, vần `ie`/`ye`/`uye` + phụ âm cuối, `ieu`/`yeu`/`uoi` không phụ âm cuối, `uo` + phụ âm cuối và `gi` + `e` (+ phụ âm cuối hoặc `u`) được hiển thị với `ê`/`ô`: `vietj` → việt, `muons` → muốn, `tuoir` → tuổi, `giengs` → giếng. Chỉ đổi `e`/`o` chưa có dấu phụ; `ươ`, `ưo`, `uơ` giữ nguyên.
- **Không có dấu thanh thì không đổi** (`tieng`, `viet`, `quiet`), để từ tiếng Anh và thói quen gõ `ee` không bị ảnh hưởng.
- **Tính khi hiển thị, không ghi vào chữ đã gõ** (`promoteCircumflex` trả mảng mới): bỏ dấu bằng phím dấu gõ đôi trả lại đúng phím đã gõ (`vietjj` → `vietj`). Riêng `z` chỉ xóa dấu thanh nên giữ dấu mũ (`vietjz` → `viêt`, như `vieetjz`).
- Âm tiết đã thêm dấu mũ được dùng để xét hợp lệ, nên `vietj` ra việt kể cả khi tắt *Gõ dấu tự do*.
- **Tiếng Anh:** so bản cũ/mới trên danh sách từ có `ie`/`uo`, chỉ `diets`, `quiets` bị đổi; hai từ này vào danh sách từ phiên bản 4. Gõ thiếu `w` ra dấu mũ (`dduongf` → đuồng, `nguoif` → nguồi), giống GoTiengViet.
