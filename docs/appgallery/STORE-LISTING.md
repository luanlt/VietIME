# Nội dung trang ứng dụng trên AppGallery

Dán vào **AppGallery Connect → ứng dụng VietIME → Thông tin ứng dụng (App information)**. Giới hạn ký tự có thể thay đổi theo giao diện AGC; các đoạn dưới đây đã viết ngắn gọn.

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Tên ứng dụng | VietIME |
| Tên gói (bundle name) | `com.vietime.inputmethod` |
| Phiên bản | 1.0.4 (versionCode 1001004) |
| Thiết bị | PC / 2in1 (HarmonyOS PC); cũng khai báo tablet, phone |
| HarmonyOS tối thiểu | 6.1.0 (API 23) |
| Danh mục | Công cụ (Tools) → Bàn phím / Nhập liệu |
| Giá | Miễn phí, không mua trong ứng dụng, không quảng cáo |
| Độ tuổi | Mọi lứa tuổi (3+) |
| Ngôn ngữ | Tiếng Việt (chính), English |
| Nhà phát triển | Lại Thành Luân |
| Email hỗ trợ | v.luanlt@gmail.com |
| Điện thoại | 0961722886 |
| Chính sách quyền riêng tư | *(URL công khai sau khi đăng `privacy-policy.html`)* |
| Quyền hệ thống | Không có |

## Mô tả ngắn

**Tiếng Việt:** Bộ gõ tiếng Việt Telex cho HarmonyOS PC, gõ nhanh như UniKey, hoạt động ngoại tuyến.

**English:** Offline Vietnamese Telex keyboard for HarmonyOS PC with a UniKey-like typing feel.

## Mô tả đầy đủ (tiếng Việt)

VietIME là bộ gõ tiếng Việt kiểu Telex dành cho máy tính HarmonyOS PC, dùng với bàn phím vật lý.

• Gõ Telex quen thuộc: tieengs Vieetj → tiếng Việt, dd → đ, uw/w → ư, ow → ơ, aa/ee/oo → â/ê/ô.
• Cảm giác gõ giống UniKey: chữ được ghi thẳng vào ô nhập, dấu được sửa tại chỗ, đặt dấu tự do ở bất kỳ vị trí nào trong từ.
• Tự nhận diện từ tiếng Anh ngay khi gõ (project, windows, class…) nên không cần chuyển chế độ khi gõ lẫn Anh–Việt. Có danh sách từ giữ nguyên do bạn tự quản lý.
• Chuyển Việt/Anh bằng phím Shift, Alt+Z hoặc Ctrl+Space; biểu tượng Ví/EN trên khay hệ thống và ô báo nổi có thể kéo thả.
• Hoạt động với ứng dụng HarmonyOS và ứng dụng Android chạy qua EasyAbroad (Zalo, Messenger…).
• Tự bỏ qua ô mật khẩu, địa chỉ web và email.
• Riêng tư tuyệt đối: không cần quyền nào, không kết nối mạng, không lưu lịch sử gõ.

Cách dùng: mở VietIME → “Mở cài đặt bộ gõ” → bật và chọn VietIME.

## Full description (English)

VietIME is a Vietnamese Telex input method for HarmonyOS PC and physical keyboards.

• Standard Telex: tieengs Vieetj → tiếng Việt, dd → đ, uw/w → ư, ow → ơ, aa/ee/oo → â/ê/ô.
• UniKey-like feel: text goes straight into the field and tones are corrected in place; tone keys can be typed anywhere in a word.
• Automatic English word detection while typing (project, windows, class…), plus a user-managed keep-as-typed word list.
• Switch Vietnamese/English with Shift, Alt+Z or Ctrl+Space; Ví/EN indicator in the system tray and an optional draggable badge.
• Works in HarmonyOS apps and in Android apps running through EasyAbroad.
• Password, URL and email fields are bypassed automatically.
• Private by design: no permissions, no network access, no typing history.

## Từ khóa

bộ gõ tiếng Việt, telex, unikey, bàn phím tiếng Việt, gõ dấu, Vietnamese keyboard, Vietnamese input, HarmonyOS PC

## Có gì mới trong 1.0.4

- Kiểu gõ UniKey: không gạch chân, sửa dấu tại chỗ; phím d ở bất kỳ vị trí nào (dinhd → đinh).
- Tự nhận diện từ tiếng Anh; danh sách từ giữ nguyên có thể xem, sửa, xóa.
- Biểu tượng Ví/EN trên khay hệ thống, ô báo nổi, phím tắt Shift.
- Hỗ trợ ứng dụng Android qua EasyAbroad; tối ưu tốc độ khi gõ nhanh.

## Hình ảnh cần chuẩn bị

Theo yêu cầu hiện hành của AGC cho thiết bị PC/2in1 (kiểm tra lại kích thước trong AGC khi tải lên):
1. Biểu tượng ứng dụng: dùng `AppScope/resources/base/media/app_icon.png` (logo 1024×1024 gốc ở `icon_background.png`).
2. Ảnh chụp màn hình, tối thiểu 3 ảnh, chụp trên MateBook:
   - Trang Cài đặt VietIME (phần đầu, có logo).
   - Gõ tiếng Việt trong một ứng dụng (ví dụ Ghi chú) với ô báo Ví.
   - Biểu tượng Ví/EN trên khay hệ thống + ô báo nổi.
   - Danh sách từ tiếng Anh giữ nguyên.
   Có thể chụp bằng `hdc shell snapshot_display -f /data/local/tmp/s.jpeg` rồi `hdc file recv`.
