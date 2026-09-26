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
