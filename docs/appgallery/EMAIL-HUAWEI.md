# Email gửi Huawei (AppGallery)

Lưu ý: AppGallery **không duyệt ứng dụng qua email**. Hồ sơ phải được nộp bằng nút **Submit for review** trong AppGallery Connect. Email dưới đây dùng để (1) báo cho bộ phận hỗ trợ nhà phát triển rằng bạn đã nộp và nhờ lưu ý các điểm đặc thù của ứng dụng bộ gõ, hoặc (2) hỏi trước về yêu cầu riêng cho ứng dụng nhập liệu.

**Gửi tới:** kênh hỗ trợ trong AppGallery Connect (biểu tượng **Hỗ trợ / Online customer service → Submit ticket** ở góc trên) hoặc địa chỉ email hỗ trợ nhà phát triển Huawei dành cho khu vực của bạn, lấy trên trang [developer.huawei.com](https://developer.huawei.com) → Support. Không đoán địa chỉ; dùng đúng địa chỉ trên trang chính thức.

Thay các phần trong `[ ]` trước khi gửi.

---

## Bản tiếng Anh (khuyến nghị gửi)

**Subject:** Review request – VietIME (com.vietime.inputmethod), Vietnamese input method for HarmonyOS PC

Dear AppGallery Review Team,

My name is Lai Thanh Luan, an individual developer registered on AppGallery Connect (developer ID: [your developer ID]). I have submitted my app **VietIME** for review and would like to share some context to help the review.

**App details**
- App name: VietIME
- Package name: com.vietime.inputmethod
- Version: 1.0.4 (version code 1001004)
- App ID: [App ID from AGC]
- Target devices: HarmonyOS PC (2in1), HarmonyOS 6.1.0 (API 23) or later
- Category: Tools – Input method
- Distribution: [Vietnam / countries selected], free, no ads, no in-app purchases

**What the app does**
VietIME is a Vietnamese Telex input method (InputMethodExtensionAbility) designed for HarmonyOS PC with a physical keyboard. It converts Telex key sequences into Vietnamese text (e.g. “tieengs Vieetj” → “tiếng Việt”), detects English words automatically, and works in both HarmonyOS apps and Android apps running through EasyAbroad. There is currently no Vietnamese Telex input method with this PC-focused behaviour on HarmonyOS PC, and it has been tested on a MateBook Pro S (HarmonyOS 6.1.0).

**Privacy and security**
- The app requests **no permissions** and contains **no network code**, analytics, advertising or third-party SDKs.
- Keystrokes are processed only in memory for the word being typed and are never stored or transmitted.
- Password, PIN and OTP fields are bypassed by default.
- Privacy policy: [public URL of privacy-policy.html]

**Testing instructions**
Detailed steps are included in the “Notes for reviewers” field. In short: open VietIME → “Mở cài đặt bộ gõ” → enable and select VietIME → type `tieengs Vieetj` in any text field. Press and release Shift (or Alt+Z) to switch between Vietnamese and English; the Ví/EN icon in the system tray updates accordingly. No login is required.

Please note that Ctrl+Shift is reserved by HarmonyOS PC for switching input methods, so VietIME uses Shift, Alt+Z or Ctrl+Space as its toggle shortcut. The on-screen keyboard is optional and hidden by default because the app targets PCs with physical keyboards.

If any additional information, documents or a demo video are needed for the review of an input method app, please let me know and I will provide them promptly.

Thank you for your time and support.

Best regards,
Lai Thanh Luan
Email: v.luanlt@gmail.com
Phone: +84 961 722 886

---

## Bản tiếng Việt (để đối chiếu hoặc gửi kênh hỗ trợ tại Việt Nam)

**Tiêu đề:** Đề nghị xét duyệt – VietIME (com.vietime.inputmethod), bộ gõ tiếng Việt cho HarmonyOS PC

Kính gửi Bộ phận kiểm duyệt AppGallery,

Tôi là Lại Thành Luân, nhà phát triển cá nhân trên AppGallery Connect (mã nhà phát triển: [mã của bạn]). Tôi đã nộp ứng dụng **VietIME** để xét duyệt và xin gửi thêm thông tin để thuận tiện cho việc kiểm tra.

**Thông tin ứng dụng**
- Tên: VietIME · Tên gói: com.vietime.inputmethod · Phiên bản: 1.0.4 (1001004) · App ID: [App ID]
- Thiết bị: HarmonyOS PC (2in1), HarmonyOS 6.1.0 (API 23) trở lên
- Danh mục: Công cụ – Bộ gõ · Phát hành tại: [Việt Nam / khu vực đã chọn] · Miễn phí, không quảng cáo, không mua trong ứng dụng

**Chức năng**
VietIME là bộ gõ tiếng Việt kiểu Telex (InputMethodExtensionAbility) dành cho HarmonyOS PC dùng bàn phím vật lý: chuyển chuỗi Telex thành chữ có dấu (ví dụ “tieengs Vieetj” → “tiếng Việt”), tự nhận diện từ tiếng Anh, hoạt động với ứng dụng HarmonyOS và ứng dụng Android qua EasyAbroad. Ứng dụng đã được kiểm thử trên MateBook Pro S (HarmonyOS 6.1.0).

**Quyền riêng tư và bảo mật**
- Không yêu cầu quyền nào; không có mã kết nối mạng, không analytics, quảng cáo hay SDK bên thứ ba.
- Phím gõ chỉ được xử lý tạm trong bộ nhớ cho từ đang gõ, không lưu và không gửi đi.
- Ô mật khẩu, PIN, OTP mặc định được bỏ qua.
- Chính sách quyền riêng tư: [URL công khai]

**Hướng dẫn kiểm tra**
Mở VietIME → “Mở cài đặt bộ gõ” → bật và chọn VietIME → gõ `tieengs Vieetj` trong ô nhập bất kỳ. Nhấn-nhả Shift (hoặc Alt+Z) để chuyển Việt/Anh; biểu tượng Ví/EN trên khay hệ thống đổi theo. Không cần đăng nhập. Ctrl+Shift được HarmonyOS PC dùng để đổi bộ gõ nên VietIME dùng Shift, Alt+Z hoặc Ctrl+Space.

Nếu cần thêm tài liệu hoặc video minh họa cho việc xét duyệt ứng dụng bộ gõ, xin vui lòng cho tôi biết, tôi sẽ cung cấp ngay.

Trân trọng,
Lại Thành Luân
Email: v.luanlt@gmail.com · Điện thoại: 0961722886
