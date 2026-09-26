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
