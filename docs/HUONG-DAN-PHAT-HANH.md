# Hướng dẫn phát hành VietIME lên AppGallery — làm từ đầu

Danh sách việc theo thứ tự, từ tài khoản tới khi người dùng cài được từ AppGallery. Chi tiết kỹ thuật (cấu hình ký, lệnh build, cài thử trên máy khác) nằm trong [RELEASE.md](RELEASE.md). Hồ sơ nộp duyệt nằm trong [appgallery/](appgallery/).

Tên menu trên trang Huawei có thể lệch đôi chút theo phiên bản giao diện.

## Giai đoạn 1 — Tài khoản (làm một lần)

- [ ] **1. Xác minh danh tính nhà phát triển.**
  Vào [developer.huawei.com](https://developer.huawei.com), đăng nhập bằng tài khoản đã dùng trong DevEco. Mở **Console → Account center** và hoàn tất **xác minh danh tính**: cá nhân dùng CCCD/hộ chiếu, doanh nghiệp dùng giấy phép kinh doanh. Chưa xác minh thì không phát hành được. Bước này có thể mất vài ngày, nên làm đầu tiên.
- [ ] **2. Đồng ý thỏa thuận AppGallery Connect.**
  Mở [AppGallery Connect](https://developer.huawei.com/consumer/en/service/josp/agc/index.html) và chấp nhận thỏa thuận nhà phát triển.

## Giai đoạn 2 — Tạo ứng dụng và chứng chỉ phát hành

- [ ] **3. Tạo ứng dụng.**
  AGC → **My apps → New app**:
  - Nền tảng: **HarmonyOS**
  - Tên: **VietIME**
  - Tên gói: **`com.vietime.inputmethod`**
  - Ngôn ngữ mặc định: Tiếng Việt

  Nếu tên gói đã có người dùng, xem mục đổi tên gói trong [RELEASE.md](RELEASE.md).
- [ ] **4. Tạo khóa và CSR trong DevEco.**
  Mở dự án VietIME → **Build → Generate Key and CSR**:
  - Tạo `vietime-release.p12`, alias `vietime`, đặt mật khẩu mạnh.
  - Lưu thêm `vietime-release.csr`.

  ⚠️ **Sao lưu file `.p12` và mật khẩu ra nơi an toàn**, không đưa lên GitHub. Mất là không bao giờ cập nhật được ứng dụng trên AppGallery.
- [ ] **5. Tạo chứng chỉ phát hành.**
  AGC → **Certificates, app IDs, and profiles → Certificates → New certificate** → loại **Release** → tải lên `.csr` → tải về `vietime-release.cer`.
- [ ] **6. Tạo profile phát hành.**
  AGC → **Profiles → Add** → chọn ứng dụng VietIME → loại **Release** → chọn chứng chỉ vừa tạo → tải về `vietime-release.p7b`.

## Giai đoạn 3 — Build gói phát hành

- [ ] **7. Nhập chữ ký phát hành vào DevEco.**
  **File → Project Structure → Signing Configs**:
  1. Bỏ chọn *Automatically generate signature*.
  2. Chọn ba file `.p12`, `.cer`, `.p7b`.
  3. Nhập mật khẩu (DevEco tự mã hóa).
- [ ] **8. Build `.app` đã ký phát hành.**
  ```powershell
  & .\scripts\build.ps1 -Mode release -Target app
  ```
  Kết quả: `build/outputs/default/VietIME-default-signed.app`. Đây là file tải lên AGC.

## Giai đoạn 4 — Chuẩn bị hồ sơ (làm song song với giai đoạn 2)

- [ ] **9. Đăng chính sách quyền riêng tư công khai.**
  Tải [appgallery/privacy-policy.html](appgallery/privacy-policy.html) lên một địa chỉ công khai, ví dụ GitHub Pages hoặc Google Sites. Giữ lại đường link.
- [ ] **10. Chụp ảnh màn hình.**
  Cần ít nhất 3 ảnh:
  - trang Cài đặt VietIME,
  - lúc đang gõ tiếng Việt (có ô báo Ví),
  - biểu tượng Ví/EN trên khay hệ thống.

  Chụp qua kết nối debug:
  ```bash
  hdc shell snapshot_display -f /data/local/tmp/s.jpeg
  hdc file recv /data/local/tmp/s.jpeg
  ```

## Giai đoạn 5 — Nộp duyệt và phát hành

- [ ] **11. Điền trang ứng dụng.**
  AGC → VietIME → **Version information**:
  - Tải lên file `.app`.
  - Dán nội dung từ [appgallery/STORE-LISTING.md](appgallery/STORE-LISTING.md).
  - Dán link chính sách quyền riêng tư.
  - Khai báo *không thu thập dữ liệu, không quyền nhạy cảm*.
  - Dán phần tiếng Anh của [appgallery/REVIEW-NOTES.md](appgallery/REVIEW-NOTES.md) vào ô *Notes for reviewers*.
- [ ] **12. Chọn hình thức phát hành.**
  Nên chọn **Internal testing** trước: mời vài người bằng Huawei ID, họ cài qua link AppGallery. Ổn định rồi chuyển sang **Release**, khu vực Việt Nam.
- [ ] **13. Bấm Submit for review.**
  Theo dõi kết quả trong AGC. Cần giải thích thêm thì gửi email trong [appgallery/EMAIL-HUAWEI.md](appgallery/EMAIL-HUAWEI.md) qua kênh hỗ trợ của AGC. Huawei không duyệt qua email.

## Phát hành bản cập nhật về sau

1. Tăng `versionCode` và `versionName` trong `AppScope/app.json5`.
2. Build lại `.app` bằng **cùng chứng chỉ phát hành**.
3. AGC → tạo phiên bản mới → tải lên → gửi duyệt.

## Việc nên làm ngay

- **Bước 1**, vì chờ duyệt lâu nhất.
- **Bước 9**, vì cần có link công khai trước khi nộp.
