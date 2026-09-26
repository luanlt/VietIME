# Phát hành VietIME lên AppGallery

Danh sách việc theo thứ tự từ đầu: [HUONG-DAN-PHAT-HANH.md](HUONG-DAN-PHAT-HANH.md). File này là chi tiết kỹ thuật.

HarmonyOS thương mại không cho cài tự do file `.hap` trên máy bất kỳ. Có hai cách để VietIME đến tay người khác:

| Cách | Ai cài được | Cần gì |
|---|---|---|
| **A. AppGallery** (khuyến nghị) | Mọi người, cài từ AppGallery (hoặc qua link kiểm thử) | Chứng chỉ + profile **phát hành**, gói `.app`, Huawei duyệt |
| **B. Ký debug theo máy** | Tối đa 100 máy đã đăng ký UDID, bật chế độ nhà phát triển | Profile **debug** chứa UDID các máy, cài bằng `hdc`/DevEco |

Các bước trên AppGallery Connect (AGC) phải do chủ tài khoản Huawei Developer thực hiện. Tên menu có thể khác đôi chút theo phiên bản giao diện AGC.

## A. Phát hành qua AppGallery

### 1. Tài khoản và ứng dụng
1. Đăng nhập [AppGallery Connect](https://developer.huawei.com/consumer/en/service/josp/agc/index.html) bằng tài khoản Huawei Developer đã xác minh danh tính (cá nhân hoặc doanh nghiệp).
2. **My apps → New app**: nền tảng **HarmonyOS**, tên **VietIME**, tên gói **`com.vietime.inputmethod`**, danh mục **App**, ngôn ngữ mặc định **Tiếng Việt**.
   - Nếu tên gói đã bị người khác dùng, đổi `bundleName` trong `AppScope/app.json5` (và `BUNDLE` trong `entry/src/main/ets/utils/StatusBridge.ets`) rồi build lại.

### 2. Chứng chỉ và profile phát hành
1. DevEco Studio → **Build → Generate Key and CSR**: tạo keystore `vietime-release.p12` (alias `vietime`, đặt mật khẩu mạnh, **cất giữ an toàn — mất là không cập nhật được ứng dụng**) và file `vietime-release.csr`.
2. AGC → **Certificates, app IDs, and profiles → Certificates → New certificate**: loại **Release certificate**, tải lên `.csr`, tải về `vietime-release.cer`.
3. AGC → **Profiles → Add**: chọn ứng dụng VietIME, loại **Release**, chứng chỉ vừa tạo → tải về `vietime-release.p7b`.

### 3. Cấu hình ký phát hành
Thêm vào `signingConfigs` trong `build-profile.json5` (giữ cấu hình `default` để tiếp tục thử trên máy):
```json5
{
  "name": "release",
  "type": "HarmonyOS",
  "material": {
    "storeFile": "C:/Users/<bạn>/.ohos/release/vietime-release.p12",
    "storePassword": "<điền trong DevEco, được mã hóa>",
    "keyAlias": "vietime",
    "keyPassword": "<điền trong DevEco, được mã hóa>",
    "certpath": "C:/Users/<bạn>/.ohos/release/vietime-release.cer",
    "profile": "C:/Users/<bạn>/.ohos/release/vietime-release.p7b",
    "signAlg": "SHA256withECDSA"
  }
}
```
Cách an toàn nhất là nhập qua **File → Project Structure → Signing Configs** (bỏ chọn *Automatically generate signature*), để DevEco tự mã hóa mật khẩu. Sau đó đổi `"signingConfig": "release"` trong product `default`.

### 4. Build gói phát hành
```powershell
& .\scripts\build.ps1 -Mode release -Target app
```
Kết quả: `build/outputs/default/VietIME-default-signed.app`. Đây là file tải lên AGC (không tải `.hap`).

### 5. Điền thông tin và gửi duyệt
1. AGC → VietIME → **Version information / Draft**: tải lên `.app`.
2. Điền nội dung từ [appgallery/STORE-LISTING.md](appgallery/STORE-LISTING.md): mô tả, từ khóa, danh mục, ảnh chụp màn hình, email hỗ trợ.
3. **Privacy policy URL**: đăng [appgallery/privacy-policy.html](appgallery/privacy-policy.html) lên một địa chỉ công khai (GitHub Pages, Google Sites…) rồi dán link.
4. Khai báo quyền riêng tư / dữ liệu: *không thu thập dữ liệu*, *không quyền nhạy cảm*.
5. **Notes for reviewers**: dán phần tiếng Anh trong [appgallery/REVIEW-NOTES.md](appgallery/REVIEW-NOTES.md).
6. Chọn phạm vi phát hành (quốc gia/khu vực, ví dụ Việt Nam) và hình thức:
   - **Internal testing / Open testing**: mời người thử bằng Huawei ID, họ cài qua link AppGallery trước khi phát hành chính thức.
   - **Release**: phát hành công khai.
7. **Submit for review**. Theo dõi kết quả và phản hồi trong AGC; nếu cần hỏi thêm, dùng mẫu email trong [appgallery/EMAIL-HUAWEI.md](appgallery/EMAIL-HUAWEI.md).

### 6. Phát hành bản cập nhật
Tăng `versionCode`/`versionName` trong `AppScope/app.json5`, build lại `.app` bằng **cùng chứng chỉ phát hành**, tạo phiên bản mới trong AGC và gửi duyệt.

## B. Cài thử trên máy khác (ký debug)

1. Máy mới: bật **Chế độ nhà phát triển** và **Wireless debugging**, kết nối `hdc tconn <IP:port>`, lấy UDID: `hdc shell bm get --udid`.
2. AGC → **Devices → Add device**: nhập UDID. Sau đó **Profiles**: sửa profile debug của VietIME, chọn thêm thiết bị, tải lại `.p7b` (hoặc kết nối máy vào DevEco và dùng *Automatically generate signature*, DevEco tự đăng ký).
3. Build `& .\scripts\build.ps1 -Mode release` và cài: `hdc -t <IP:port> install -r entry\build\default\outputs\default\entry-default-signed.hap`.

Profile debug có hạn dùng (thường vài tháng); hết hạn thì tạo lại và build lại.
