import { common, ConfigurationConstant } from '@kit.AbilityKit';
import { settings, BusinessError } from '@kit.BasicServicesKit';
import { inputMethod } from '@kit.IMEKit';
import { SettingsModel } from '../settings/SettingsModel';
import { SettingsRepository } from '../settings/SettingsRepository';
import { DEFAULT_ENGLISH_WORDS } from '../engine/VietnameseInputEngine';
import { WordListEditor } from './WordListEditor';
import { MacroEditor } from './MacroEditor';
import { AppRulesEditor } from './AppRulesEditor';
import { AppHistory } from '../settings/AppHistory';
import BuildProfile from 'BuildProfile';
import { SettingsSignal } from '../utils/StatusBridge';

// Stored values stay in English for compatibility with saved preferences; only labels are Vietnamese.
const THEMES: string[] = ['System', 'Light', 'Dark'];
const THEME_LABELS: string[] = ['Theo hệ thống', 'Sáng', 'Tối'];
const APP_VERSION: string = BuildProfile.VERSION_NAME + ' (build ' + BuildProfile.VERSION_CODE + ')';

@Entry
@Component
struct Index {
  @State config: SettingsModel = new SettingsModel();
  @State status: string = 'Đang tải cài đặt…';
  @State selectedIme: string = 'Chưa kiểm tra';
  private repository: SettingsRepository | undefined = undefined;
  private saveQueue: Promise<void> = Promise.resolve();
  @State recentApps: string[] = [];
  private history: AppHistory | undefined = undefined;

  aboutToAppear(): void {
    try {
      const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      this.repository = SettingsRepository.get(context); this.config = this.repository.load();
      this.history = new AppHistory(context); this.refreshApps();
      this.status = 'Ngoại tuyến · đã tải cài đặt'; this.applyTheme(); this.refreshIme();
    } catch (error) { this.status = 'Không đọc được cài đặt'; }
  }
  // The floating badge can hide itself (long press), so pick up changes made outside this page.
  onPageShow(): void {
    try { if (this.repository) { this.config = this.repository.load(); } } catch (error) { this.status = 'Không đọc được cài đặt'; }
    this.refreshApps();
  }
  private refreshApps(): void { this.recentApps = this.history?.recent() ?? []; }
  private clearApps(): void {
    const history = this.history;
    if (!history) { return; }
    history.clear().then((): void => { this.recentApps = []; SettingsSignal.notify(); this.status = 'Đã xóa danh sách ứng dụng gần đây'; })
      .catch((error: BusinessError): void => { this.status = `Xóa thất bại (${error.code})`; });
  }
  private refreshIme(): void {
    try { this.selectedIme = inputMethod.getCurrentInputMethod().name; }
    catch (error) { this.selectedIme = 'Không lấy được trạng thái bộ gõ hệ thống'; }
  }
  private save(): void {
    const repo = this.repository;
    if (!repo) { this.status = 'Không lưu được cài đặt'; return; }
    // Save serialized on the UI process; the extension receives preference notifications.
    this.status = 'Đang lưu…';
    this.saveQueue = this.saveQueue.then(async (): Promise<void> => { await repo.save(this.config); SettingsSignal.notify(); this.status = 'Đã lưu trên thiết bị này'; })
      .catch((error: BusinessError): void => { this.status = `Lưu thất bại (${error.code})`; });
  }
  private applyTheme(): void {
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    const mode = this.config.theme === 'Dark' ? ConfigurationConstant.ColorMode.COLOR_MODE_DARK :
      (this.config.theme === 'Light' ? ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT : ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    try { context.getApplicationContext().setColorMode(mode); } catch (error) { this.status = 'Không đổi được giao diện'; }
  }
  private bundleList(): string[] {
    return this.config.excludedBundles.split(',').map((s: string): string => s.trim()).filter((s: string): boolean => s.length > 0);
  }
  @Builder
  section(title: string, subtitle: string) {
    Column({ space: 4 }) {
      Text(title).fontSize(23).fontWeight(FontWeight.Bold).fontColor($r('sys.color.ohos_id_color_text_primary'))
      Text(subtitle).fontSize(13).fontColor($r('sys.color.ohos_id_color_text_secondary'))
    }.alignItems(HorizontalAlign.Start).width('100%').margin({ top: 26, bottom: 14 })
  }
  @Builder
  switchRow(title: string, subtitle: string, value: boolean, changed: (value: boolean) => void) {
    Row({ space: 20 }) {
      Column({ space: 4 }) {
        Text(title).fontSize(16).fontColor($r('sys.color.ohos_id_color_text_primary'))
        Text(subtitle).fontSize(12).fontColor($r('sys.color.ohos_id_color_text_secondary'))
      }.alignItems(HorizontalAlign.Start).layoutWeight(1)
      Toggle({ type: ToggleType.Switch, isOn: value }).selectedColor('#126B60').onChange(changed)
    }.width('100%').padding({ top: 12, bottom: 12 })
  }
  @Builder
  infoRow(label: string, value: string) {
    Row({ space: 16 }) {
      Text(label).fontSize(14).fontColor($r('sys.color.ohos_id_color_text_secondary')).width(110)
      Text(value).fontSize(15).fontColor($r('sys.color.ohos_id_color_text_primary')).layoutWeight(1).copyOption(CopyOptions.LocalDevice)
    }.width('100%').padding({ top: 6, bottom: 6 })
  }
  build() {
    Scroll() {
      Column({ space: 0 }) {
        Row({ space: 16 }) {
          Image($r('app.media.app_icon')).width(58).height(58).objectFit(ImageFit.Contain)
          Column({ space: 3 }) {
            Text('VietIME').fontSize(34).fontWeight(FontWeight.Bold).fontColor($r('sys.color.ohos_id_color_text_primary'))
            Text('Tiếng Việt, trên bàn phím của bạn.').fontSize(15).fontColor($r('sys.color.ohos_id_color_text_secondary'))
          }.alignItems(HorizontalAlign.Start)
          Blank()
          Text('TELEX').fontSize(12).fontWeight(FontWeight.Medium).fontColor('#126B60').padding(10).backgroundColor('#E0EFE7').borderRadius(8)
        }.width('100%').margin({ bottom: 24 })
        Column({ space: 12 }) {
          Text('Chọn VietIME trong cài đặt bàn phím của hệ thống').fontSize(17).fontWeight(FontWeight.Medium).fontColor('#173D30')
          Text('Bộ gõ hệ thống hiện tại: ' + this.selectedIme).fontSize(12).fontColor('#466254')
          Row({ space: 12 }) {
            Button('Mở cài đặt bộ gõ').backgroundColor('#126B60').onClick(() => {
              try { settings.openInputMethodSettings(this.getUIContext().getHostContext() as common.UIAbilityContext); }
              catch (error) { this.status = 'Không mở được Cài đặt. Hãy chọn VietIME trong cài đặt hệ thống.'; }
            })
            Button('Làm mới').backgroundColor('#FFFFFF').fontColor('#126B60').onClick(() => this.refreshIme())
          }
        }.width('100%').alignItems(HorizontalAlign.Start).padding(22).borderRadius(18).backgroundColor('#E4EFE8')

        this.section('Chung', 'Bật bộ gõ hệ thống và chế độ tiếng Việt là hai thiết lập riêng.')
        this.switchRow('Gõ tiếng Việt', 'TẮT: phím đi thẳng tới ứng dụng, không chuyển Telex.', this.config.enabled, (v: boolean) => { this.config.enabled = v; this.save(); })
        Row() { Text('Kiểu gõ').layoutWeight(1); Text('Telex').fontColor('#126B60') }.width('100%').padding({ top: 12, bottom: 12 })
        Row() {
          Text('Phím tắt chuyển Việt/Anh').layoutWeight(1)
          Select([{ value: 'Alt+Z' }, { value: 'Shift' }, { value: 'Ctrl+Space' }]).value(this.config.shortcut)
            .onSelect((index: number, value: string) => { this.config.shortcut = value; this.save(); })
        }.width('100%')
        Text('Mặc định Alt+Z. Shift: nhấn rồi nhả riêng phím Shift (gõ chữ hoa không bị ảnh hưởng). Ctrl+Shift do HarmonyOS dùng để đổi bộ gõ nên không dùng được. Chỉ nhấn-nhả nhanh Shift mới chuyển chế độ; giữ Shift lâu (Shift+click chuột, gõ chữ hoa) không chuyển. Cũng có thể bấm biểu tượng Ví/EN trên khay hoặc ô báo nổi. Esc trả từ đang gõ về đúng các phím đã bấm.')
          .fontSize(12).fontColor($r('sys.color.ohos_id_color_text_secondary')).width('100%').margin({ top: 8 })
        this.switchRow('Khởi động ở chế độ tiếng Việt', 'Áp dụng khi bộ gõ khởi động lại.', this.config.startVietnamese, (v: boolean) => { this.config.startVietnamese = v; this.save(); })
        this.switchRow('Hiện ô báo chế độ nổi', 'Mặc định TẮT. Ô nhỏ Ví / EN ở góc trái màn hình khi đang nhập liệu: bấm để chuyển chế độ, kéo để di chuyển, nhấn giữ hoặc chuột phải để ẩn.', this.config.floatingBadge, (v: boolean) => { this.config.floatingBadge = v; this.save(); })

        this.section('Theo ứng dụng', 'Tự bật Ví hoặc EN khi chuyển sang từng ứng dụng.')
        this.switchRow('Tự chuyển Việt/Anh theo ứng dụng', 'BẬT: khi bắt đầu gõ trong ứng dụng đã chọn, VietIME tự chuyển sang Ví hoặc EN. Vẫn chuyển tay được bằng phím tắt; lựa chọn đó giữ tới khi sang ứng dụng khác.', this.config.perAppEnabled, (v: boolean) => { this.config.perAppEnabled = v; this.save(); })
        if (this.config.perAppEnabled) {
          this.switchRow('Dùng quy tắc có sẵn theo loại ứng dụng', 'Terminal (HiShell, Hish, TermNext, SSH…) luôn EN. Văn phòng (WPS, Pure Office, Ghi chú, Email), trình duyệt, trợ lý AI và ứng dụng Android qua EasyAbroad luôn Ví. Ứng dụng bạn tự chọn bên dưới được ưu tiên hơn.', this.config.perAppPresets, (v: boolean) => { this.config.perAppPresets = v; this.save(); })
          this.switchRow('Tự nhớ chế độ cho ứng dụng khác', 'Ứng dụng chưa chọn sẽ mở lại đúng chế độ Ví/EN bạn dùng lần trước trong ứng dụng đó. TẮT: dùng chung chế độ chuyển tay gần nhất.', this.config.perAppRemember, (v: boolean) => { this.config.perAppRemember = v; this.save(); })
          AppRulesEditor({ items: this.config.appRules, recent: this.recentApps, presets: this.config.perAppPresets,
            onChanged: (items: string[]): void => { this.config.appRules = items; this.save(); },
            onRefresh: (): void => this.refreshApps(), onClearRecent: (): void => this.clearApps() })
          Text('Ứng dụng Android chạy qua EasyAbroad dùng chung một mã (com.easy.hmos.abroad) nên được xem là một ứng dụng. Danh sách gần đây chỉ lưu mã ứng dụng trên máy này, không lưu nội dung gõ.')
            .fontSize(12).fontColor($r('sys.color.ohos_id_color_text_secondary')).width('100%').margin({ top: 8 })
        }

        this.section('Bàn phím', 'Bàn phím vật lý luôn hoạt động; bàn phím ảo là tùy chọn.')
        this.switchRow('Hiện bàn phím ảo', 'Cho phép bàn phím ảo của VietIME xuất hiện.', this.config.virtualKeyboard, (v: boolean) => { this.config.virtualKeyboard = v; this.save(); })
        this.switchRow('Tự động hiện bàn phím ảo', 'TẮT: chỉ hiện khi chạm vào ô nhập.', this.config.autoShow, (v: boolean) => { this.config.autoShow = v; this.save(); })
        Text('Bàn phím vật lý: BẬT').fontSize(13).fontColor('#126B60').width('100%')

        this.section('Tiếng Việt', 'Quy tắc âm tiết, đặt dấu và nhận diện từ.')
        this.switchRow('Gõ kiểu UniKey (không gạch chân)', 'BẬT: chữ được ghi thẳng vào ô nhập và sửa dấu tại chỗ như UniKey trên Windows. TẮT: chữ đang gõ được gạch chân tới khi xong từ.', this.config.uniKeyStyle, (v: boolean) => { this.config.uniKeyStyle = v; this.save(); })
        this.switchRow('Luôn bỏ dấu khi gõ lại phím dấu', 'Gõ liền hai lần luôn bỏ dấu như UniKey (oss → os). BẬT: gõ lại phím dấu ở cuối từ cũng bỏ dấu (tests → tets). TẮT: giữ từ tiếng Anh (tests, office).', this.config.uniKeyUndo, (v: boolean) => { this.config.uniKeyUndo = v; this.save(); })
        // Stored as modernTone for saved settings; ON has always meant hóa / thúy (the old placement).
        this.switchRow('Đặt dấu kiểu cũ (hóa, thúy)', 'BẬT: hóa, khỏe, thúy. TẮT (kiểu mới): hoá, khoẻ, thuý.', this.config.modernTone, (v: boolean) => { this.config.modernTone = v; this.save(); })
        this.switchRow('Gõ dấu tự do', 'BẬT: gõ dấu ở bất kỳ đâu, kể cả trước khi gõ đủ nguyên âm (viejet → việt) và d cuối từ vẫn thành đ (dinhd → đinh). TẮT: dấu chỉ nhận khi phần đã gõ là âm tiết hợp lệ (vieejt, vieetj), đ phải gõ dd liền nhau.', this.config.freeTyping, (v: boolean) => { this.config.freeTyping = v; this.save(); })
        this.switchRow('Phím z xóa dấu', 'BẬT: z bỏ dấu thanh của từ đang gõ (toasz → toa). TẮT: z là chữ z bình thường.', this.config.zRemovesTone, (v: boolean) => { this.config.zRemovesTone = v; this.save(); })
        this.switchRow('Tự khôi phục từ sai cấu trúc', 'Trả lại đúng phím đã gõ khi kết thúc một từ không phải âm tiết tiếng Việt (quyefn → quyefn thay vì quyèn).', this.config.restoreInvalid, (v: boolean) => { this.config.restoreInvalid = v; this.save(); })
        this.switchRow('Tự nhận diện từ tiếng Anh', 'Giữ nguyên từ không thể là tiếng Việt ngay khi gõ (project, class, windows). Gõ lặp phím dấu để giữ nguyên: boss, tests.', this.config.englishDetection, (v: boolean) => { this.config.englishDetection = v; this.save(); })
        Text('Từ tiếng Anh luôn giữ nguyên').fontSize(16).fontColor($r('sys.color.ohos_id_color_text_primary')).width('100%').margin({ top: 8 })
        Text('Dành cho từ tiếng Anh trùng cách gõ tiếng Việt (test → tét). Chỉ áp dụng khi kết thúc từ.').fontSize(12)
          .fontColor($r('sys.color.ohos_id_color_text_secondary')).width('100%').margin({ bottom: 8 })
        WordListEditor({ items: this.config.englishList, placeholder: 'Thêm từ, ví dụ: deadline, server', lowercase: true,
          onChanged: (items: string[]): void => { this.config.englishList = items; this.save(); } })
        Button('Khôi phục danh sách mặc định').fontSize(13).backgroundColor('#8A8F94').margin({ top: 8, bottom: 12 })
          .onClick(() => { this.config.englishList = DEFAULT_ENGLISH_WORDS.slice(); this.save(); })
        Text('Chưa có kiểm tra chính tả bằng từ điển; bộ gõ chỉ kiểm tra cấu trúc âm tiết.').fontSize(12)
          .fontColor($r('sys.color.ohos_id_color_text_secondary')).width('100%')

        this.section('Tính năng nâng cao', 'Tự viết hoa, gõ tắt và cách xử lý phím ký hiệu.')
        this.switchRow('Viết hoa chữ cái đầu câu', 'Tự viết hoa chữ đầu tiên sau dấu . ! ? rồi dấu cách hoặc xuống dòng. Chỉ áp dụng khi gõ tiếng Việt.', this.config.autoCapitalize, (v: boolean) => { this.config.autoCapitalize = v; this.save(); })
        // Field-start capitals are part of auto-capitalization and do nothing without it.
        if (this.config.autoCapitalize) {
          this.switchRow('Viết hoa chữ đầu ô nhập trống', 'Viết hoa chữ đầu tiên khi con trỏ ở đầu ô nhập. Nên TẮT nếu hay gõ trong Excel hoặc ô tìm kiếm.', this.config.capitalizeFieldStart, (v: boolean) => { this.config.capitalizeFieldStart = v; this.save(); })
        }
        this.switchRow('Để hệ thống gõ số và ký hiệu', 'BẬT: ở ứng dụng HarmonyOS, phím số và ký hiệu (= - [ ] ; …) do hệ thống xử lý như khi dùng bàn phím Celia, tránh lỗi = thành +. Ứng dụng Android (EasyAbroad) luôn do VietIME ghi. TẮT: VietIME tự ghi ký tự ở mọi ứng dụng.', this.config.nativeSymbols, (v: boolean) => { this.config.nativeSymbols = v; this.save(); })
        this.switchRow('Gõ tắt', 'Thay từ viết tắt bằng cụm từ đầy đủ khi kết thúc từ: vn → Việt Nam, Vn → Việt Nam, KO → KHÔNG.', this.config.macroEnabled, (v: boolean) => { this.config.macroEnabled = v; this.save(); })
        MacroEditor({ items: this.config.macros, onChanged: (items: string[]): void => { this.config.macros = items; this.save(); } })
          .visibility(this.config.macroEnabled ? Visibility.Visible : Visibility.None)

        this.section('Hành vi', 'Không thu thập hay gửi nội dung gõ ra mạng.')
        this.switchRow('Gõ tiếng Việt trong ô mật khẩu', 'Mặc định TẮT. Nội dung ô nhạy cảm không bao giờ hiện trong trang chẩn đoán.', this.config.passwordVietnamese, (v: boolean) => { this.config.passwordVietnamese = v; this.save(); })
        this.switchRow('Tự chuyển tiếng Anh cho địa chỉ web', 'Dựa vào loại ô nhập và tiền tố như http:. Với văn bản khó đoán hãy chuyển sang EN.', this.config.autoUrl, (v: boolean) => { this.config.autoUrl = v; this.save(); })
        this.switchRow('Tự chuyển tiếng Anh cho email', 'Bỏ qua ô nhập email và giữ nguyên từ khi gặp @.', this.config.autoEmail, (v: boolean) => { this.config.autoEmail = v; this.save(); })
        // UniKey style already types directly everywhere, so the fallback only matters without it.
        if (!this.config.uniKeyStyle) {
          this.switchRow('Gõ trực tiếp cho ứng dụng không hỗ trợ gạch chân', 'Dành cho ứng dụng Android (EasyAbroad) như Zalo: xóa và ghi lại phần chữ đang gõ. TẮT: các ứng dụng đó nhận phím gốc, không có dấu.', this.config.directFallback, (v: boolean) => { this.config.directFallback = v; this.save(); })
        }
        Text('Ứng dụng bỏ qua (luôn gõ tiếng Anh)').fontSize(16).fontColor($r('sys.color.ohos_id_color_text_primary')).width('100%').margin({ top: 12 })
        Text('Mã ứng dụng (bundle ID), ví dụ terminal hoặc trình soạn code.').fontSize(12)
          .fontColor($r('sys.color.ohos_id_color_text_secondary')).width('100%').margin({ bottom: 8 })
        WordListEditor({ items: this.bundleList(), placeholder: 'com.example.terminal', lowercase: false, maxItems: 100,
          onChanged: (items: string[]): void => { this.config.excludedBundles = items.join(','); this.save(); } })

        this.section('Giao diện', 'Tùy chỉnh hiển thị.')
        Row() {
          Text('Chủ đề trang cài đặt').layoutWeight(1)
          Select([{ value: THEME_LABELS[0] }, { value: THEME_LABELS[1] }, { value: THEME_LABELS[2] }])
            .value(THEME_LABELS[Math.max(0, THEMES.indexOf(this.config.theme))])
            .onSelect((index: number) => { this.config.theme = THEMES[index]; this.applyTheme(); this.save(); })
        }.width('100%')
        Text('Chiều cao bàn phím ảo: ' + this.config.keyboardHeight + ' vp').width('100%').margin({ top: 16 })
        Slider({ value: this.config.keyboardHeight, min: 180, max: 420, step: 10 }).onChange((value: number, mode: SliderChangeMode) => {
          this.config.keyboardHeight = value; if (mode === SliderChangeMode.End || mode === SliderChangeMode.Click) { this.save(); }
        })
        Text('Cỡ chữ trên phím: ' + this.config.keyLabelSize + ' fp').width('100%').margin({ top: 12 })
        Slider({ value: this.config.keyLabelSize, min: 14, max: 32, step: 1 }).onChange((value: number, mode: SliderChangeMode) => {
          this.config.keyLabelSize = value; if (mode === SliderChangeMode.End || mode === SliderChangeMode.Click) { this.save(); }
        })

        this.section('Chẩn đoán', 'Kiểm tra trạng thái bộ gõ và thử engine Telex.')
        Button('Chẩn đoán & thử engine').onClick(() => this.getUIContext().getRouter().pushUrl({ url: 'pages/Diagnostics' }))
        Text('Ngoại tuyến. Không gửi dữ liệu. Chỉ lưu cài đặt; không lưu lịch sử phím hay nội dung đã nhập.').fontSize(13)
          .fontColor($r('sys.color.ohos_id_color_text_secondary')).margin({ top: 16 })

        this.section('Giới thiệu', 'VietIME ' + APP_VERSION + ' · HarmonyOS 6.1.0 trở lên (API 23+)')
        Column({ space: 4 }) {
          Text('Tác giả').fontSize(17).fontWeight(FontWeight.Medium).fontColor($r('sys.color.ohos_id_color_text_primary')).margin({ bottom: 6 })
          this.infoRow('Họ và tên', 'Lại Thành Luân')
          this.infoRow('Email', 'v.luanlt@gmail.com')
          this.infoRow('Điện thoại', '0961722886')
        }.width('100%').alignItems(HorizontalAlign.Start).padding(20).borderRadius(16).backgroundColor($r('sys.color.ohos_id_color_card_bg'))

        Text(this.status).fontSize(12).fontColor('#126B60').margin({ top: 20, bottom: 28 })
      }.width('100%').constraintSize({ maxWidth: 880 }).padding(32).alignItems(HorizontalAlign.Start)
    }.width('100%').height('100%').backgroundColor($r('sys.color.ohos_id_color_background'))
  }
}
