# Chính sách quyền riêng tư của VietIME

Áp dụng cho VietIME 1.0.4 trở lên · Cập nhật: 26/09/2026
Nhà phát triển: Lại Thành Luân · v.luanlt@gmail.com · 0961722886

## Tóm tắt

VietIME là bộ gõ tiếng Việt chạy **hoàn toàn trên thiết bị**. Ứng dụng **không kết nối mạng**, **không thu thập**, **không lưu** và **không gửi** nội dung bạn gõ tới bất kỳ ai, kể cả nhà phát triển.

## Quyền truy cập

Ứng dụng không yêu cầu quyền hệ thống nào: không Internet, không micro, không danh bạ, không vị trí, không đọc bộ nhớ ngoài, không đọc clipboard. Mã nguồn không dùng API mạng, analytics, quảng cáo, telemetry hay dịch vụ đám mây.

## Xử lý phím gõ

Với vai trò bộ gõ hệ thống, VietIME nhận phím bạn nhấn để chuyển Telex thành chữ có dấu (ví dụ `tieengs` → `tiếng`). Các phím của từ đang gõ chỉ nằm trong bộ nhớ tạm (RAM) của phiên nhập, tối đa 128 ký tự, và bị xóa khi kết thúc từ, rời ô nhập hoặc đóng bộ gõ. Không có lịch sử gõ, không có từ điển học từ người dùng.

## Ô mật khẩu và ô nhạy cảm

Ô mật khẩu, mã PIN, mã OTP và mật khẩu màn hình khóa mặc định được **bỏ qua**: phím đi thẳng tới ứng dụng, VietIME không xử lý. Người dùng có thể chủ động bật gõ tiếng Việt cho các ô này trong Cài đặt; khi đó phím vẫn chỉ được xử lý tạm trong RAM.

## Dữ liệu được lưu trên thiết bị

Chỉ lưu **cài đặt** do bạn chọn, trong bộ nhớ riêng của ứng dụng: bật/tắt tiếng Việt, phím tắt, kiểu đặt dấu, tùy chọn giao diện, danh sách từ tiếng Anh giữ nguyên, danh sách ứng dụng bỏ qua và danh sách ứng dụng luôn Ví/EN do bạn tự chọn. Khi bạn bật *Tự chuyển Việt/Anh theo ứng dụng*, VietIME lưu thêm **mã ứng dụng** (bundle ID) của tối đa 30 ứng dụng gần đây bạn đã gõ và chế độ Ví/EN đã dùng ở đó, để bạn chọn trong Cài đặt; không lưu nội dung gõ, có thể xóa bằng nút *Xóa danh sách*. Gỡ ứng dụng sẽ xóa toàn bộ dữ liệu này.

## Chẩn đoán

Trang Chẩn đoán trong ứng dụng chỉ hiển thị trạng thái kỹ thuật (đang chạy, chế độ VI/EN, có gắn ô nhập hay không) khi bạn mở trang đó. Dữ liệu này trao đổi nội bộ giữa các thành phần của chính VietIME trên máy, không ghi ra file, không gửi đi và không chứa nội dung gõ hay tên ứng dụng khác. Nhật ký hệ thống của bản phát hành chỉ ghi mã và thông báo lỗi kỹ thuật của hệ điều hành, không ghi nội dung gõ.

## Trẻ em

Ứng dụng không thu thập dữ liệu cá nhân của bất kỳ ai, kể cả trẻ em.

## Liên hệ

Mọi câu hỏi về quyền riêng tư: **Lại Thành Luân** — v.luanlt@gmail.com — 0961722886.

---

# VietIME Privacy Policy (English)

Applies to VietIME 1.0.4 and later · Updated: 2026-09-26 · Developer: Lai Thanh Luan · v.luanlt@gmail.com

VietIME is a Vietnamese input method that runs **entirely on the device**. It has **no network access** and **does not collect, store or transmit** anything you type.

- **Permissions:** none. No Internet, microphone, contacts, location, storage or clipboard access; no analytics, ads, telemetry or cloud services.
- **Keystrokes:** processed only in memory to convert Telex input into Vietnamese text; the current word (max 128 characters) is discarded when the word ends, the field loses focus or the keyboard closes. No typing history is kept.
- **Password fields:** password, PIN, OTP and lock-screen fields are bypassed by default.
- **Stored data:** only the settings you choose (mode, shortcut, tone style, display options, your English word list, excluded apps and per-app Ví/EN choices; when per-app switching is on, also the bundle IDs of up to 30 recently used apps and the mode last used there, never typed text), kept in the app's private storage and removed on uninstall.
- **Diagnostics:** an in-app status page shows technical state on request only; nothing is written to files or sent off the device. Release builds log only technical error codes and system error messages, never typed text.
- **Contact:** Lai Thanh Luan — v.luanlt@gmail.com — +84 961 722 886.
