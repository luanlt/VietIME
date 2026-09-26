# VietIME — HarmonyOS NEXT / PC

**Phiên bản 1.0.0**: bộ gõ tiếng Việt Telex cho HarmonyOS PC (native ArkTS/ArkUI), đã chạy trên MateBook Pro S. Giao diện cài đặt tiếng Việt, ô báo chế độ nổi Ví / EN, nhận diện từ tiếng Anh, gõ trực tiếp cho ứng dụng Android (EasyAbroad).

Tác giả: **Lại Thành Luân** · v.luanlt@gmail.com · 0961722886

**Phát hành:** bắt đầu từ [docs/HUONG-DAN-PHAT-HANH.md](docs/HUONG-DAN-PHAT-HANH.md) (các bước từ đầu), chi tiết kỹ thuật trong [docs/RELEASE.md](docs/RELEASE.md) (AppGallery và cài thử theo máy) và hồ sơ trong [docs/appgallery/](docs/appgallery/): chính sách quyền riêng tư, nội dung trang ứng dụng, ghi chú cho người duyệt, email gửi Huawei.

## Đã kiểm chứng trên máy phát triển

- DevEco Studio **6.1.1.280**, HarmonyOS SDK **6.1.1.125 / API 24** tại `C:\Program Files\Huawei\DevEco Studio\sdk\default`.
- Hvigor `assembleHap`: **BUILD SUCCESSFUL**; bytecode ArkTS được đóng trong HAP.
- **384 test qua**: 341 test engine (gồm corpus và 34 từ tiếng Anh), 43 test session/shortcut với editor giả lập (gồm chế độ gõ trực tiếp và con trỏ báo trễ).
- Gói chứa extension `type: inputMethod`, subtype `vi-VN`, target `2in1`, không khai báo permission.
- **Đã chạy trên MateBook Pro S (MOR-M1), HarmonyOS 6.1.0.135 / API 24** qua hdc không dây, bản ký debug: gõ được tiếng Việt trong ứng dụng native (pre-edit) và Zalo qua EasyAbroad (gõ trực tiếp). Editor của EasyAbroad báo `isTextPreviewSupported=false` và báo vị trí con trỏ trễ một thao tác; session tự tính vị trí con trỏ để chịu độ trễ này.

Artifact: `entry/build/default/outputs/default/entry-default-unsigned.hap`. Gói chưa ký không phải gói sẵn sàng cài trên PC thương mại. [Kết quả kiểm tra gói](docs/hap-verification.json) có SHA-256; [kết quả test](docs/test-results.json) có số liệu benchmark Windows, không phải độ trễ HarmonyOS IPC.

## Cấu trúc

```text
AppScope/                  bundle và tài nguyên chung
entry/src/main/ets/
  entryability/            UIAbility mở Settings
  pages/                   Settings, diagnostics và sandbox engine
  settings/                Preferences, cấu hình có validation
  ime/                     InputMethodExtensionAbility, physical keys, editor adapter
  engine/                  Telex, parser âm tiết, interface engine
  keyboard/                soft keyboard dùng chung engine
  utils/                   trao đổi metadata diagnostics trong cùng bundle
scripts/                   build, audit SDK, unit tests, kiểm tra HAP
 tests/                    fixtures, corpus, session/shortcut tests
```

## Build và test

Mở thư mục này trong DevEco Studio, hoặc chạy PowerShell tại thư mục project:

```powershell
& 'C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin\ohpm.bat' install
& .\scripts\audit-sdk.ps1
& 'C:\Program Files\Huawei\DevEco Studio\tools\node\node.exe' .\scripts\test.cjs
& .\scripts\build.ps1 -Mode release   # bản tối ưu để dùng; bỏ -Mode để build debug có log chẩn đoán
& .\scripts\verify-hap.ps1
```

Build script đặt PATH/JAVA_HOME/SDK chỉ trong process hiện tại. Nếu IDE nằm ở chỗ khác, truyền `-Studio` cho script PowerShell và đặt `VIETIME_STUDIO` khi chạy unit test. Test dùng TypeScript compiler đi kèm SDK. Không có dependency runtime bên ngoài.

Compile SDK **6.1.1 (API 24)**; target/minimum **HarmonyOS 6.1.0 / API 23** (MateBook Pro S chạy HarmonyOS PC 6.1.0). Mọi API đang dùng đã được đối chiếu `@since` ≤ 23; `settings.openInputMethodSettings` cần đúng API 23, không hạ thấp hơn nữa.

## Ký và cài thử

1. Kết nối thiết bị HarmonyOS phù hợp, bật chế độ phát triển và cho phép kết nối debug. Kiểm tra bằng `hdc list targets`.
2. Trong DevEco: **File > Project Structure > Project > Signing Configs**, cấu hình chữ ký HarmonyOS cho bundle `com.vietime.inputmethod`. Làm theo [hướng dẫn ký chính thức Huawei](https://developer.huawei.com/consumer/cn/doc/HarmonyOS-Guides/ide-signing-auto), đăng nhập tài khoản và liên kết thiết bị khi IDE yêu cầu.
3. Build lại; kiểm tra đã có HAP signed và hết cảnh báo thiếu signingConfig. Dùng Run trong IDE để cài; không đổi tên unsigned thành signed.
4. Mở VietIME, chọn **Mở Input Method Settings**, enable/select VietIME bằng hệ thống.
5. Để `Show virtual keyboard = OFF`, thử `tieengs Vieetj` trong TextArea tại Diagnostics và ứng dụng đích. Phải được `tiếng Việt` mà không hiện panel.
6. Chạy checklist trong [COMPATIBILITY.md](docs/COMPATIBILITY.md); ghi OS/app version và kết quả thật.

## Hành vi hiện có

- Nhận phím bằng `KeyboardDelegate.on('keyEvent')`; dùng `unicodeChar` của sự kiện cho Shift/Caps Lock/layout.
- Pre-edit chính thức: `setPreviewTextSync` / `finishTextPreviewSync`; không delete/insert toàn từ trên mỗi phím.
- VI/EN, Ctrl+Shift (nhả tổ hợp), Alt+Z, Ctrl+Space; chỉ nhận tổ hợp hệ thống chuyển tới IME. Không global hook.
- Backspace sửa composition; ngoài composition để editor xử lý. Enter/cursor/navigation kết thúc pre-edit rồi pass-through.
- Panel được tạo để đáp ứng hợp đồng SDK nhưng mặc định ẩn; không detach khi người dùng tắt bàn phím ảo.
- Preferences lưu một snapshot cấu hình; refresh theo lifecycle/notification, không I/O mỗi phím.
- Password mặc định bypass; không log văn bản, không telemetry. Diagnostics liên process chỉ gửi metadata trong cùng bundle theo yêu cầu.

## Giới hạn cần biết

- Editor báo không hỗ trợ pre-edit (ví dụ ứng dụng Android qua EasyAbroad): **gõ trực tiếp** — mỗi phím xóa/ghi lại phần khác biệt của từ đang gõ bằng `deleteForwardSync`/`insertTextSync`. Tắt được bằng "Direct typing for apps without pre-edit". Nếu editor không báo được vị trí con trỏ, click chuột giữa từ rồi gõ tiếp có thể sửa nhầm từ trước; nhấn phím mũi tên hoặc Space trước khi click để an toàn. Lỗi IPC làm session chuyển bypass; không retry thao tác xóa/ghi phỏng đoán.
- Nhận diện tiếng Anh ngay khi gõ bằng cấu trúc âm tiết + danh sách từ mở rộng được (xem SPEC-DECISIONS). Từ tiếng Anh trùng hoàn toàn một âm tiết tiếng Việt hợp lệ mà không có trong danh sách (ví dụ `mix` -> `mĩ`) vẫn được thêm dấu: gõ lặp phím dấu (`mixx`) hoặc thêm vào danh sách.
- URL/email dựa vào editor type và ký tự cấu trúc. URL không có scheme, tên miền trần, hoặc prefix mơ hồ có thể cần chuyển EN trước khi gõ. Escape phục hồi raw token hiện tại; chưa có temporary-English giữ modifier.
- Có danh sách bundle ID bypass cho terminal/code; không tự đoán loại ứng dụng. Custom shortcut, tray/status icon và mở Settings VietIME trực tiếp từ mục IME của hệ thống chưa triển khai vì chưa xác minh đầy đủ hợp đồng public tương ứng.
- Chưa kiểm thử hiển thị menu IME, panel ẩn trên MateBook, đồng bộ Preferences thực tế, trạng thái diagnostics IPC, password hoặc độ trễ <10 ms trên thiết bị.
- Một số ví dụ đầu bài thiếu ký tự Telex; xem [quyết định về đặc tả](docs/SPEC-DECISIONS.md). Không âm thầm autocorrect chữ hoa hoặc thêm dấu mũ.

[SDK audit](docs/SDK-AUDIT.md) · [Thiết kế](docs/IMPLEMENTATION-PLAN.md) · [Riêng tư](PRIVACY.md)
