# SDK/API audit — 2026-09-25

Đã kiểm tra SDK thật trước khi viết implementation. Máy ban đầu chưa cài SDK; sau khi người dùng cài, đã xác minh DevEco **6.1.1.280**, SDK **HarmonyOS 6.1.1.125 Release / API 24**. Project chọn compile/target/minimum `6.1.1(24)`.

Root declaration: `C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\ets\api`.

[sdk-evidence.json](sdk-evidence.json) lưu phiên bản, SHA-256 và số dòng declaration; có thể tái tạo bằng `scripts/audit-sdk.ps1`. Compiler ArkTS đã kiểm tra imports và chữ ký API trong build thành công.

## Declaration và cách dùng

| SDK declaration | Kết luận/triển khai |
|---|---|
| @ohos.InputMethodExtensionAbility.d.ts | onCreate(Want), onDestroy(), context; entry module đăng ký extension type inputMethod |
| @ohos.inputMethodEngine.d.ts: InputMethodAbility | getInputMethodAbility(), inputStart(KeyboardController, InputClient), inputStop; không dùng InputMethodEngine/TextInputClient cũ |
| KeyboardDelegate | on/off keyEvent nhận InputKeyEvent và trả boolean consumed; selectionChange và editorAttributeChanged |
| @ohos.multimodalInput.keyEvent.d.ts | Action DOWN/UP/CANCEL, unicodeChar, ctrlKey/shiftKey/altKey/logoKey/fnKey; không tự áp mã ASCII từ keycode |
| InputClient | getEditorAttributeSync, getTextIndexAtCursorSync, setPreviewTextSync, finishTextPreviewSync, insertTextSync; soft Backspace dùng deleteForwardSync |
| InputClient.sendKeyFunction | API async; soft Enter dùng enterKeyType; physical Enter commit sync rồi editor xử lý native |
| InputClient.moveCursorSync / selectByRangeSync | Có trong SDK; physical navigation/selection chuyển editor xử lý sau commit thay vì mô phỏng lại |
| EditorAttribute | isTextPreviewSupported, inputPattern, enterKeyType, bundleName; client không hỗ trợ preview sẽ bypass |
| Panel | createPanel, setUiContent, resize, show, hide, destroyPanel; tạo panel ẩn khi virtual keyboard OFF |
| KeyboardController.hide | Public; hideKeyboard cũ deprecated. Runtime dùng Panel.hide; không gọi stopInputSession để tắt panel |
| inputMethodEngine.AttachOptions | getAttachOptions().requestKeyboardReason và isSimpleKeyboardEnabled?; thuộc tính cuối không phải getter function |
| @ohos.inputMethod.d.ts | InputMethodController thuộc phía editor. showTextInput/AttachOptions.showKeyboard không được dùng để điều khiển editor của ứng dụng khác |
| inputMethod.setSimpleKeyboardEnabled | Cờ phía ứng dụng editor, không dùng làm nút OFF toàn hệ thống của VietIME |
| @ohos.InputMethodSubtype.d.ts | mode chỉ `upper` hoặc `lower`; config VietIME dùng lower, locale vi-VN |
| @ohos.settings.d.ts | openInputMethodSettings(context) public từ API 23; có nút mở trong Settings UI |
| @ohos.data.preferences.d.ts | getPreferencesSync, một giá trị settings JSON, flush, change/multiProcessChange, removePreferencesFromCacheSync |
| @ohos.commonEventManager.d.ts + commonEvent/*.d.ts | createSubscriberSync/subscribe/publish/unsubscribe; publisherBundleName và bundleName đều giới hạn com.vietime.inputmethod |

Không thấy showKeyboard như một phương thức để IME toàn quyền bật editor bất kỳ; dùng Panel.show đúng phía extension. Không dùng API Android, system/private API, global interceptor hoặc keyboard injection.

## Manifest và tích hợp hệ thống

SDK `toolchains/modulecheck/module.json` xác nhận `inputMethod`, metadata và deviceTypes `2in1`. Resource compiler và PackingCheck đã chấp nhận module chứa cả EntryAbility và VietIMEExtension. Metadata `ohos.extension.input_method` trỏ `$profile:input_method_config`. HAP đã kiểm tra chứa đúng manifest và bytecode.

Chưa khẳng định đường dẫn chính xác/khả năng enable trong UI của từng bản HarmonyOS PC nếu chưa chạy thiết bị. Chưa tìm được bằng chứng đủ để thêm metadata riêng cho Settings ability/tray. Không suy ra “hệ thống cấm” từ việc chưa tìm thấy tài liệu.

## Tài liệu đối chiếu

- [Huawei inputMethod](https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-inputmethod): phạm vi editor của setSimpleKeyboardEnabled và controller.
- [Huawei pre-edit FAQ](https://developer.huawei.com/consumer/cn/doc/doccenter-dev-faq/faqs-ime-7): setPreviewText/finishTextPreview và range {-1,-1}.
- [Huawei thay đổi API 23](https://developer.huawei.com/consumer/en/doc/harmonyos-releases/js-apidiff-imekit-6101): migration khỏi interface cũ.
- [OpenHarmony official subtype guide](https://raw.githubusercontent.com/openharmony/docs/master/en/application-dev/inputmethod/input-method-subtype-guide.md): cấu trúc metadata/subtype; được đối chiếu với SDK Huawei, không coi OpenHarmony là bằng chứng hành vi PC thương mại.
- [OpenHarmony official input method guide](https://raw.githubusercontent.com/openharmony/docs/master/en/application-dev/inputmethod/inputmethod-application-guide.md): lifecycle/panel mẫu; implementation và error handling của VietIME riêng.

Một số trang Huawei IME engine/guide không tải được nội dung bằng công cụ đọc web. Không dùng bài sao chép bên thứ ba để thay declaration SDK. Không thể xác nhận tính năng runtime chỉ từ compiler.
