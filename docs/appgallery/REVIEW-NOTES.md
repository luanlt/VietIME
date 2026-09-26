# Ghi chú cho bộ phận kiểm duyệt (Notes for reviewers)

Dán phần tiếng Anh vào ô **“Notes for reviewers / Thông tin cho người kiểm duyệt”** khi gửi duyệt trên AppGallery Connect. Không cần tài khoản đăng nhập.

---

## English (paste this)

**App type:** System input method (InputMethodExtensionAbility) for Vietnamese Telex typing, primarily for HarmonyOS PC (2in1) with a physical keyboard. It also contains a settings UI (EntryAbility).

**Permissions:** none requested. The app has no network code, no analytics, no ads and stores no typed text. Password/PIN/OTP fields are bypassed by default.

**How to test**
1. Install and open **VietIME**. Tap **“Mở cài đặt bộ gõ”** (Open input method settings), enable **VietIME** and set it as the current input method. (Alternatively: Settings → System → Input method.)
2. Open any text field, e.g. Notes or a search box (URL and password fields are intentionally bypassed).
3. Type `tieengs Vieetj` → the text becomes **“tiếng Việt”**. More examples: `dduowngf` → “đường”, `nguoiwf` → “người”, `project` stays “project”.
4. Press and release **Shift** alone (or Alt+Z) to toggle Vietnamese/English; the **Ví / EN** icon in the system tray changes accordingly. A small draggable Ví/EN badge appears at the bottom-left while typing (can be turned off in settings).
5. Settings screen (Vietnamese UI): options for tone style, UniKey-style direct typing, English word list (view/add/edit/delete), excluded apps, virtual keyboard, theme, diagnostics and the author information.

**Notes**
- The on-screen soft keyboard is optional and hidden by default because the target is a PC with a physical keyboard; enable it in settings under “Hiện bàn phím ảo”.
- The **Ctrl+Shift** shortcut is reserved by HarmonyOS PC for switching input methods, so the app uses Shift / Alt+Z / Ctrl+Space.
- Contact: Lai Thanh Luan · v.luanlt@gmail.com · +84 961 722 886.

---

## Tiếng Việt (để bạn đối chiếu)

**Loại ứng dụng:** bộ gõ hệ thống (InputMethodExtensionAbility) gõ tiếng Việt kiểu Telex, chủ yếu cho HarmonyOS PC dùng bàn phím vật lý; kèm giao diện cài đặt.

**Quyền:** không yêu cầu quyền nào. Không có mã kết nối mạng, không analytics, không quảng cáo, không lưu nội dung gõ; ô mật khẩu/PIN/OTP mặc định bỏ qua.

**Cách kiểm tra:** mở VietIME → “Mở cài đặt bộ gõ” → bật và chọn VietIME → gõ `tieengs Vieetj` trong một ô nhập sẽ ra “tiếng Việt”; nhấn-nhả Shift (hoặc Alt+Z) để chuyển Việt/Anh, biểu tượng Ví/EN trên khay đổi theo.
