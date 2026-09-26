<div align="center">

<img src="AppScope/resources/base/media/app_icon.png" alt="VietIME logo" width="128" height="128">

# VietIME

**Bộ gõ tiếng Việt Telex cho HarmonyOS PC — gõ nhanh như UniKey, chạy hoàn toàn ngoại tuyến.**

[![Version](https://img.shields.io/badge/version-1.0.5-2563eb)](AppScope/app.json5)
[![HarmonyOS](https://img.shields.io/badge/HarmonyOS-6.1.0%2B%20(API%2023)-cf0a2c)](build-profile.json5)
[![ArkTS](https://img.shields.io/badge/ArkTS-ArkUI-7c3aed)](entry/src/main/ets)
[![Tests](https://img.shields.io/badge/tests-438%20passed-16a34a)](docs/test-results.json)
[![Permissions](https://img.shields.io/badge/permissions-none-0f766e)](PRIVACY.md)

[Tính năng](#-tính-năng) · [Cài đặt](#-cài-đặt--sử-dụng) · [Build](#-build-từ-mã-nguồn) · [Kiến trúc](#-kiến-trúc) · [Giới hạn](#-giới-hạn-đã-biết) · [Tài liệu](#-tài-liệu)

</div>

---

## Giới thiệu

VietIME là bộ gõ tiếng Việt kiểu **Telex** viết native bằng ArkTS/ArkUI cho **HarmonyOS PC (2in1)**, dùng với bàn phím vật lý. Bộ gõ đăng ký với hệ thống qua `InputMethodExtensionAbility`, không cần quyền hệ thống nào, không kết nối mạng và không lưu lịch sử gõ.

Phiên bản **1.0.5** đã chạy thực tế trên **Huawei MateBook Pro S (MOR-M1), HarmonyOS 6.1.0.135 / API 24**, gõ được trong ứng dụng HarmonyOS native và ứng dụng Android chạy qua EasyAbroad (Zalo, Messenger…).

```text
tieengs Vieetj  →  tiếng Việt
dinhd           →  đinh
nhw             →  như
project windows →  project windows   (tự nhận diện tiếng Anh)
```

## ✨ Tính năng

| | |
|---|---|
| ⌨️ **Telex chuẩn** | `aa/ee/oo → â/ê/ô`, `aw → ă`, `ow → ơ`, `uw/w → ư`, `dd → đ`, dấu `s f r x j`, `z` xóa dấu. |
| ⚡ **Cảm giác UniKey** | Gõ thẳng vào ô nhập, không gạch chân; dấu được sửa tại chỗ và đặt tự do ở bất kỳ vị trí nào trong từ; `d` ở cuối từ vẫn tạo `đ` (`dinhd → đinh`). |
| 🔤 **Nhận diện tiếng Anh** | Kiểm tra cấu trúc âm tiết ngay khi gõ (`project`, `class`, `windows`…) cùng danh sách từ giữ nguyên có thể xem, sửa, xóa trong Cài đặt. |
| 🔁 **Chuyển Việt / Anh** | Nhấn-nhả riêng **Shift** (mặc định), **Alt+Z** hoặc **Ctrl+Space**; bấm biểu tượng Ví/EN trên khay hoặc ô báo nổi. `Esc` trả từ đang gõ về đúng phím đã bấm. |
| 🏷️ **Chỉ báo trạng thái** | Biểu tượng Ví/EN trên khay hệ thống và ô báo nổi có thể kéo thả. |
| 📱 **Ứng dụng Android** | Tự chuyển sang chế độ gõ trực tiếp với editor không hỗ trợ pre-edit (EasyAbroad), chịu được việc báo vị trí con trỏ trễ. |
| 🔒 **Riêng tư** | Tự bỏ qua ô mật khẩu/PIN/OTP, URL và email; không quyền, không mạng, không telemetry. Xem [PRIVACY.md](PRIVACY.md). |
| 🔠 **Tự viết hoa** | Viết hoa chữ đầu câu sau `. ! ?` + dấu cách/xuống dòng; tùy chọn viết hoa chữ đầu ô nhập trống. |
| ✂️ **Gõ tắt** | Danh sách từ viết tắt do bạn tự quản lý: `vn → Việt Nam`, `Ko → Không`, `KO → KHÔNG`. |
| 🔣 **Phím số & ký hiệu** | Để hệ thống gõ số và ký hiệu theo đúng bố cục bàn phím (như bàn phím Celia), nên `=` trong Excel luôn ra `=`. |
| 🛠️ **Tùy biến** | Kiểu đặt dấu mới/cũ, gõ lặp phím dấu kiểu UniKey (`ass → as`), danh sách ứng dụng bỏ qua, bàn phím ảo tùy chọn, trang Chẩn đoán. |

## 📦 Cài đặt & sử dụng

> [!IMPORTANT]
> HarmonyOS thương mại không cho cài tự do file `.hap`. VietIME đến tay người dùng qua **AppGallery**, hoặc qua **bản ký debug** cho các máy đã đăng ký UDID. Xem [docs/RELEASE.md](docs/RELEASE.md).

**Yêu cầu:** thiết bị HarmonyOS PC / 2in1 chạy **HarmonyOS 6.1.0 (API 23)** trở lên, bàn phím vật lý.

1. Cài VietIME (AppGallery hoặc bản ký debug qua DevEco Studio / `hdc`).
2. Mở ứng dụng **VietIME** → **Mở cài đặt bộ gõ**.
3. Bật và chọn **VietIME** làm bộ gõ trong cài đặt hệ thống.
4. Gõ thử `tieengs Vieetj` trong bất kỳ ô nhập nào → phải ra `tiếng Việt`.

## 🔧 Build từ mã nguồn

### Môi trường đã kiểm chứng

| Thành phần | Phiên bản |
|---|---|
| DevEco Studio | 6.1.1.280 |
| HarmonyOS SDK (compile) | 6.1.1.125 / API 24 |
| Target / minimum | HarmonyOS 6.1.0 / API 23 |
| Thiết bị kiểm thử | MateBook Pro S (MOR-M1), HarmonyOS 6.1.0.135 |

Mọi API đang dùng đã được đối chiếu `@since` ≤ 23 ([SDK audit](docs/SDK-AUDIT.md)); `settings.openInputMethodSettings` cần đúng API 23 nên không thể hạ thấp hơn.

### Các bước

Mở thư mục dự án trong DevEco Studio, hoặc chạy PowerShell tại thư mục gốc:

```powershell
# 1. Cài dependency
& 'C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin\ohpm.bat' install

# 2. Đối chiếu API với SDK
& .\scripts\audit-sdk.ps1

# 3. Chạy unit test (dùng TypeScript compiler đi kèm SDK)
& 'C:\Program Files\Huawei\DevEco Studio\tools\node\node.exe' .\scripts\test.cjs

# 4. Build (bỏ -Mode release để build debug có log chẩn đoán)
& .\scripts\build.ps1 -Mode release

# 5. Kiểm tra gói HAP (SHA-256, manifest, quyền)
& .\scripts\verify-hap.ps1
```

Script chỉ đặt `PATH` / `JAVA_HOME` / SDK trong process hiện tại. Nếu DevEco Studio cài ở vị trí khác, truyền `-Studio <đường dẫn>` cho các script PowerShell và đặt biến môi trường `VIETIME_STUDIO` khi chạy test. Dự án không có dependency runtime bên ngoài.

Kết quả build nằm tại `entry/build/default/outputs/default/`. Thông tin gói phát hành gần nhất: [docs/hap-verification.json](docs/hap-verification.json).

### Ký và cài thử trên thiết bị

1. Bật chế độ nhà phát triển trên thiết bị, cho phép debug và kiểm tra bằng `hdc list targets`.
2. DevEco Studio → **File › Project Structure › Project › Signing Configs**, cấu hình chữ ký cho bundle `com.vietime.inputmethod` theo [hướng dẫn ký của Huawei](https://developer.huawei.com/consumer/cn/doc/HarmonyOS-Guides/ide-signing-auto).
3. Build lại, xác nhận đã có HAP **signed** rồi dùng **Run** để cài. Không đổi tên file unsigned thành signed.
4. Chạy checklist tương thích trong [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) và ghi lại phiên bản OS/ứng dụng cùng kết quả thực tế.

## 🧪 Kiểm thử

| Bộ test | Số lượng | Phạm vi |
|---|---:|---|
| Engine (`tests/engine.test.cjs`) | 355 | Telex, parser âm tiết, corpus, nhận diện tiếng Anh, hành vi UniKey, gõ tắt |
| Session (`tests/session.test.cjs`) | 83 | Composition session, phím tắt, gõ trực tiếp, con trỏ báo trễ, phím ký hiệu, tự viết hoa (editor giả lập) |
| **Tổng** | **438** | **0 lỗi** |

Benchmark engine thuần trên Windows: p50 ≈ 0,07 ms, p99 ≈ 0,4 ms mỗi cụm 13 phím — đây **không** phải độ trễ IPC trên HarmonyOS. Chi tiết: [docs/test-results.json](docs/test-results.json).

## 🏗️ Kiến trúc

```text
VietIME/
├── AppScope/                 # Cấu hình bundle, phiên bản, icon ứng dụng
├── entry/src/main/ets/
│   ├── engine/               # Telex engine, parser âm tiết, interface engine (không phụ thuộc framework)
│   ├── ime/                  # InputMethodExtensionAbility, xử lý phím vật lý, editor adapter, phím tắt
│   ├── keyboard/             # Bàn phím ảo dùng chung engine, ô báo trạng thái Ví/EN
│   ├── pages/                # Cài đặt, Chẩn đoán, trình sửa danh sách từ
│   ├── settings/             # Preferences, model cấu hình có validation
│   ├── entryability/         # UIAbility mở trang Cài đặt
│   └── utils/                # Trao đổi metadata chẩn đoán trong cùng bundle
├── scripts/                  # build, audit SDK, chạy test, kiểm tra HAP
├── tests/                    # Unit test engine và session
└── docs/                     # Thiết kế, quyết định đặc tả, phát hành, hồ sơ AppGallery
```

### Nguyên tắc hoạt động

- **Nhận phím** qua `KeyboardDelegate.on('keyEvent')`, dùng `unicodeChar` của sự kiện nên tôn trọng Shift / Caps Lock / layout. Không dùng global hook; chỉ nhận các tổ hợp hệ thống chuyển tới IME.
- **Hai chế độ ghi chữ:**
  - *Gõ kiểu UniKey* (mặc định): mỗi phím chỉ xóa/ghi lại phần khác biệt của từ đang gõ bằng `deleteForwardSync` / `insertTextSync`.
  - *Pre-edit*: `setPreviewTextSync` / `finishTextPreviewSync` với editor hỗ trợ, có gạch chân.
- **Backspace** sửa từ đang gõ; ngoài từ đang gõ thì để editor xử lý. Enter, phím mũi tên và điều hướng kết thúc từ rồi chuyển tiếp phím.
- **Cấu hình** lưu thành một snapshot trong Preferences, chỉ đọc lại theo lifecycle/notification — không I/O trên mỗi phím.
- **Lỗi IPC** chuyển session sang bypass; không thử lại thao tác xóa/ghi phỏng đoán.

Thiết kế chi tiết: [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) · Quyết định đặc tả: [docs/SPEC-DECISIONS.md](docs/SPEC-DECISIONS.md).

## ⚠️ Giới hạn đã biết

- **Con trỏ ở editor không báo vị trí chính xác** (ví dụ ứng dụng Android qua EasyAbroad): click chuột vào giữa từ rồi gõ tiếp có thể sửa nhầm từ trước. Nhấn phím mũi tên hoặc Space trước khi click để an toàn.
- **Từ tiếng Anh trùng âm tiết tiếng Việt hợp lệ** mà không có trong danh sách (ví dụ `mix → mĩ`) vẫn bị thêm dấu: gõ lặp phím dấu (`mixx`) hoặc thêm từ vào danh sách giữ nguyên.
- **URL / email** được nhận diện theo loại ô nhập và ký tự cấu trúc. Tên miền trần hoặc URL không có scheme có thể cần chuyển sang EN trước khi gõ.
- **Ứng dụng bỏ qua** (terminal, trình soạn code…) phải khai báo thủ công bằng bundle ID; bộ gõ không tự đoán loại ứng dụng.
- **Chưa hỗ trợ:** phím tắt tùy chỉnh ngoài 3 lựa chọn sẵn, chế độ "tạm thời tiếng Anh" khi giữ phím bổ trợ, mở trực tiếp Cài đặt VietIME từ menu bộ gõ của hệ thống.
- **Chưa đo trên thiết bị:** độ trễ đầu-cuối < 10 ms và hành vi ở mọi loại ô mật khẩu.

## 📚 Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [HUONG-DAN-PHAT-HANH.md](docs/HUONG-DAN-PHAT-HANH.md) | Các bước phát hành từ đầu |
| [RELEASE.md](docs/RELEASE.md) | Chi tiết ký, đóng gói, AppGallery và cài thử theo máy |
| [COMPATIBILITY.md](docs/COMPATIBILITY.md) | Checklist kiểm thử tương thích |
| [SDK-AUDIT.md](docs/SDK-AUDIT.md) | Đối chiếu API với SDK |
| [IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) | Thiết kế triển khai |
| [SPEC-DECISIONS.md](docs/SPEC-DECISIONS.md) | Các quyết định về đặc tả Telex / UniKey |
| [appgallery/](docs/appgallery/) | Hồ sơ AppGallery: store listing, ghi chú người duyệt, chính sách riêng tư |
| [PRIVACY.md](PRIVACY.md) | Chính sách quyền riêng tư (Tiếng Việt / English) |

## 📝 Nhật ký thay đổi

### 1.0.5 — 26/09/2026

- **Sửa lỗi phím `=` ra `+`** (ứng dụng HarmonyOS): phím số và ký hiệu giờ do hệ thống gõ theo bố cục bàn phím thật, thay vì VietIME tự ghi ký tự từ `unicodeChar` của sự kiện phím. Có thể tắt trong *Tính năng nâng cao*.
- **Ứng dụng Android qua EasyAbroad (Teams, ChatGPT…):** hết lỗi giao diện Teams nhảy sang chỗ khác khi gõ dấu cách; hết lỗi chữ lặp (`vieêệt`, `oôổn`) do EasyAbroad bỏ qua lệnh xóa 1 ký tự; sửa vị trí con trỏ sai sau khi gửi tin và ô nhập được làm trống.
- **Sửa lỗi `office` thành `offfice`**: gõ phím dấu lần thứ ba ngay sau khi đã khôi phục (`o f f f`) không còn thêm chữ thừa.
- **Mới:** tự viết hoa chữ đầu câu, viết hoa chữ đầu ô nhập (tùy chọn), gõ tắt với danh sách tự quản lý — tất cả cài đặt trong mục *Tính năng nâng cao*.

### 1.0.4 — 26/09/2026

- Gõ kiểu UniKey: ghi thẳng vào ô nhập, không gạch chân, sửa dấu tại chỗ; `d` ở bất kỳ vị trí nào (`dinhd → đinh`).
- Tự nhận diện từ tiếng Anh; danh sách từ giữ nguyên có thể xem, sửa, xóa.
- Biểu tượng Ví/EN trên khay hệ thống, ô báo nổi kéo thả được, phím tắt Shift.
- Hỗ trợ ứng dụng Android qua EasyAbroad; tối ưu tốc độ khi gõ nhanh.
- Đã kiểm thử trên Huawei MateBook Pro S.

## 👤 Tác giả

**Lại Thành Luân** — [v.luanlt@gmail.com](mailto:v.luanlt@gmail.com)

Góp ý và báo lỗi: vui lòng tạo [Issue](https://github.com/luanlt/VietIME/issues) trên GitHub.

> VietIME tái hiện hành vi gõ Telex quan sát được từ UniKey, **không** sử dụng mã nguồn UniKey (GPL).
