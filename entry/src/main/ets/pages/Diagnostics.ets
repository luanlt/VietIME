import { deviceInfo } from '@kit.BasicServicesKit';
import { inputMethod } from '@kit.IMEKit';
import { TelexEngine } from '../engine/TelexEngine';
import { parseSyllable } from '../engine/Syllable';
import { ImeStatus, StatusBridge } from '../utils/StatusBridge';

@Entry
@Component
struct Diagnostics {
  @State input: string = 'tieengs Vieetj';
  @State composition: string = '';
  @State committed: string = '';
  @State token: string = '';
  @State lastKey: string = '';
  @State syllable: string = '';
  @State selected: string = 'Chưa kiểm tra';
  @State keyCode: number = 0;
  @State modifiers: string = '';
  @State extension: string = 'Chưa có phản hồi';
  @State mode: string = 'Chưa rõ';
  @State client: string = 'Chưa rõ';
  @State panel: string = 'Chưa rõ';
  @State sampledAt: string = 'Chưa có';
  private bridge: StatusBridge = new StatusBridge();
  private engine: TelexEngine = new TelexEngine();
  aboutToAppear(): void {
    this.bridge.observe((status: ImeStatus): void => {
      this.extension = status.state; this.mode = status.mode; this.client = status.client;
      this.panel = status.panel; this.sampledAt = new Date(status.timestamp).toLocaleTimeString();
    });
    this.bridge.request();
    this.replay();
    try { this.selected = inputMethod.getCurrentInputMethod().name; } catch (error) { this.selected = 'Không lấy được'; }
  }
  aboutToDisappear(): void { this.bridge.close(); this.engine.reset(); this.input = ''; this.composition = ''; this.committed = ''; this.token = ''; this.lastKey = ''; }
  private replay(): void {
    this.engine.reset(); this.committed = '';
    for (let i = 0; i < this.input.length; i++) {
      this.lastKey = this.input.charAt(i);
      this.committed += this.engine.processKey(this.lastKey).commit;
    }
    this.update();
  }
  private update(): void {
    this.composition = this.engine.getComposition(); this.token = this.engine.getRaw();
    const parsed = parseSyllable(this.composition.split(''));
    this.syllable = `âm đầu: ${parsed.onset} · vần: ${parsed.nucleus} · âm cuối: ${parsed.coda}`;
  }
  @Builder
  detail(label: string, value: string) {
    Row({ space: 16 }) {
      Text(label).fontSize(13).fontColor($r('sys.color.ohos_id_color_text_secondary')).width(170)
      Text(value).fontSize(14).layoutWeight(1).fontColor($r('sys.color.ohos_id_color_text_primary'))
    }.width('100%').padding({ top: 9, bottom: 9 })
  }
  build() {
    Scroll() {
      Column({ space: 12 }) {
        Button('← Cài đặt').onClick(() => this.getUIContext().getRouter().back())
        Text('Chẩn đoán').fontSize(30).fontWeight(FontWeight.Bold)
        this.detail('Bộ gõ hệ thống', this.selected)
        this.detail('API tối thiểu / API máy', '23 / ' + deviceInfo.sdkApiVersion + ' (' + deviceInfo.osFullName + ')')
        this.detail('Loại thiết bị', deviceInfo.deviceType)
        this.detail('Tiện ích bộ gõ', this.extension)
        this.detail('Ô nhập', this.client)
        this.detail('Chế độ / bàn phím ảo', this.mode + ' / ' + this.panel)
        this.detail('Thời điểm lấy', this.sampledAt)
        Button('Làm mới trạng thái bộ gõ').onClick(() => { this.extension = 'Đang chờ phản hồi'; this.sampledAt = 'Đang chờ'; this.bridge.request(); })
        Text('Trạng thái chỉ được lấy khi bạn yêu cầu, không cập nhật liên tục. “Chưa rõ” có thể do hệ thống chưa khởi động bộ gõ. Trang này không đọc nội dung ô nhập của ứng dụng khác.')
          .fontSize(13).fontColor($r('sys.color.ohos_id_color_text_secondary'))
        Divider().margin({ top: 20, bottom: 12 })
        Text('Thử engine Telex').fontSize(24).fontWeight(FontWeight.Bold)
        Text('Chỉ hiển thị những ký tự bạn tự gõ vào ô thử dưới đây. Đây là thử engine, không phải kiểm thử bộ gõ hệ thống.').fontSize(13)
        TextInput({ text: this.input, placeholder: 'Phím Telex gốc' }).onChange((value: string) => { this.input = value; this.replay(); })
          .onKeyEvent((event: KeyEvent) => { this.keyCode = event.keyCode; this.modifiers = event.keyText; })
        this.detail('Phím vừa nhập', this.lastKey)
        this.detail('Mã phím / nhãn phím', this.keyCode + ' / ' + this.modifiers)
        this.detail('Các phím của từ đang gõ', this.token)
        this.detail('Từ đang gõ (đã chuyển)', this.composition)
        this.detail('Đã chốt', this.committed)
        this.detail('Âm tiết', this.syllable)
        Row({ space: 12 }) {
          Button('Xóa lùi').onClick(() => { this.engine.processKey('Backspace'); this.update(); })
          Button('Chốt từ').onClick(() => { this.committed += this.engine.finish(); this.update(); })
          Button('Làm lại').onClick(() => { this.input = ''; this.replay(); })
        }
        TextArea({ placeholder: 'Ô thử bộ gõ hệ thống: chọn VietIME rồi gõ tại đây.' }).height(150)
        TextInput({ placeholder: 'Ô mật khẩu: mặc định gõ thẳng, không thêm dấu' }).type(InputType.Password)
      }.width('100%').constraintSize({ maxWidth: 880 }).padding(32).alignItems(HorizontalAlign.Start)
    }.width('100%').height('100%').backgroundColor($r('sys.color.ohos_id_color_background'))
  }
}
