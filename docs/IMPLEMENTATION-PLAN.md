# Thiết kế và trạng thái triển khai

## Kiến trúc đang có

Entry module chứa UIAbility và InputMethodExtensionAbility. Manifest đã qua SDK resource compiler và PackingCheck. Engine .ts độc lập UI; cùng source được transpile để chạy unit test và compile vào HAP ArkTS. Không có giả lập bàn phím nằm trong TextInput để thay cho extension hệ thống.

Flow physical: KeyboardDelegate keyEvent -> shortcut/modifier filter -> CompositionSession -> TelexEngine -> HarmonyEditor -> InputClient pre-edit. SoftKeyboard gửi cùng action vào CompositionSession.

## Engine

Syllable parser tách onset/nucleus/coda; qu/gi chỉ loại bán nguyên âm nếu phía sau còn vowel. Modifier và tone là trạng thái riêng; tone được đặt lại khi nucleus/coda thay đổi. Bảng vowel Unicode tạo output NFC và giữ case. Raw token chỉ dùng trong RAM cho restore/escape, giới hạn 128 ký tự; quá giới hạn chuyển literal tới whitespace.

Restore là structural validation, chưa phải từ điển. Xem SPEC-DECISIONS.md cho các ví dụ thiếu phím, capitalization và tone policy. Interface VietnameseInputEngine để thêm VNI/VIQR về sau; hiện chỉ Telex.

## Composition và ownership

Dùng API sync đã xác minh để thứ tự phím và thao tác editor không bị đảo bởi promise. Session giữ port của client hiện tại; detach không ghi vào client bị thu hồi. Enter/navigation/modifier shortcut hoàn tất pre-edit trước khi pass-through editor.

Theo dõi cursor sau mỗi preview. Selection thay đổi bên ngoài vùng IME kết thúc preview tại chỗ, không thay văn bản lựa chọn mới. Thông báo selection do chính IME tạo được nhận diện bằng cursor dự kiến và guard synchronous. Các điều kiện reentrancy/callback thực tế vẫn cần test trên PC.

Nếu framework báo không hỗ trợ pre-edit, pass-through EN. Nếu API ném lỗi, không retry xóa/insert; session ngừng biến đổi tới phiên mới. Chưa có fallback sửa từ bằng delete/insert hoặc buffered commit cho editor không hỗ trợ preview.

## Panel và lifecycle

Tạo panel ẩn vì một số InputClient method có tiền điều kiện panel tồn tại. OFF chỉ hide panel, không detach. ON cùng autoShow cho phép framework keyboardShow hiển thị panel; nếu autoShow OFF, chỉ yêu cầu do touch được hiển thị. hide thủ công áp dụng tới phiên tiếp theo. Panel operations được nối tiếp bằng Promise queue và kiểm tra alive; create hoàn tất sau destroy sẽ được cleanup.

Phím text dùng unicodeChar (Shift/Caps Lock do framework quyết định). Key-up của phím bị consume được consume tương ứng. Ctrl+Shift chỉ toggle khi nhả tổ hợp chưa bị dùng cho phím khác. Không can thiệp hotkey hệ điều hành đã giữ lại.

## Preferences và diagnostics

Repository singleton chỉ chia sẻ trong cùng process. Giữa process dùng change/multiProcessChange notification; reload một snapshot XML khi cấu hình/lifecycle đổi, không truy vấn persistence trên mỗi phím. Các field được kiểm tra type, enum và giới hạn kích thước. Writer Settings serialize flush; thay đổi không lưu lịch sử nhập.

Diagnostics dùng CommonEvent request/reply giới hạn cả hai chiều vào bundle VietIME. Không truyền raw text, tên app đang focus hoặc composition. Snapshot chỉ được yêu cầu khi mở/refresh diagnostics. Sandbox riêng cho engine thể hiện raw key, token và result; không phải kiểm chứng system IME.

## Kiểm thử

320 test host: 297 engine/corpus và 23 session/shortcut. Fake editor kiểm tra mutation/ownership, password bypass, focus replacement, selection, lỗi preview và policy thay đổi. Không coi fake editor là runtime HarmonyOS. scripts/test.cjs tạo docs/test-results.json; scripts/verify-hap.ps1 kiểm tra bytecode/manifest/subtype/quyền và tạo docs/hap-verification.json.

## Còn cần để phát hành

Chữ ký phù hợp thiết bị; chạy trên HarmonyOS PC; kiểm tra UI và full compatibility matrix; kiểm thử Preferences/IPC khi cùng process và khác process, restart/reboot, hotkey bị hệ thống chiếm, panel ẩn, multi-window, password và latency p50/p95/p99. Dictionary spell check, fallback non-preview, custom shortcuts, temporary-English modifier và tray vẫn chưa hoàn thành. Không tuyên bố bản này là bộ gõ hoàn chỉnh hoặc đã tương thích mọi ứng dụng.
