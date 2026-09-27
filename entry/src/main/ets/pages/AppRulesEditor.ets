import { appDisplayName, MAX_APP_RULES, parseAppRule, PRESET_LABELS, presetCategory } from '../ime/AppModePolicy';

// Per-app Ví / EN rules stored as "bundle=VI|EN". Apps are picked from the ones VietIME has
// recently typed in (HarmonyOS gives no permission-free way to list installed apps) or typed
// as a bundle ID. The parent owns the data; every change is reported through onChanged.
@Component
export struct AppRulesEditor {
  @Prop items: string[] = [];
  @Prop recent: string[] = [];
  @Prop presets: boolean = true;
  onChanged: (items: string[]) => void = (items: string[]): void => {};
  onRefresh: () => void = (): void => {};
  onClearRecent: () => void = (): void => {};
  @State bundle: string = '';
  @State message: string = '';

  private bundleOf(entry: string): string { const r = parseAppRule(entry); return r.length === 2 ? r[0] : ''; }
  private modeOf(entry: string): string { const r = parseAppRule(entry); return r.length === 2 ? r[1] : ''; }
  private set(bundle: string, mode: string): boolean {
    const entry = bundle.trim() + '=' + mode;
    if (parseAppRule(entry).length !== 2) { this.message = 'Mã ứng dụng chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.'; return false; }
    const index = this.items.findIndex((e: string): boolean => this.bundleOf(e) === bundle.trim());
    if (index >= 0) {
      const next = this.items.slice(); next[index] = entry; this.onChanged(next);
    } else {
      if (this.items.length >= MAX_APP_RULES) { this.message = `Tối đa ${MAX_APP_RULES} ứng dụng.`; return false; }
      this.onChanged([entry].concat(this.items));
    }
    this.message = `${appDisplayName(bundle.trim())}: luôn ${mode === 'EN' ? 'EN' : 'Ví'}.`;
    return true;
  }
  private remove(index: number): void {
    const bundle = this.bundleOf(this.items[index]);
    this.onChanged(this.items.filter((e: string, i: number): boolean => i !== index));
    this.message = `Đã bỏ ${appDisplayName(bundle)}.`;
  }
  // Built-in rule shown under the app name: "Có sẵn: EN · Terminal".
  private presetText(bundle: string): string {
    const category = this.presets ? presetCategory(bundle) : '';
    return category.length === 0 ? '' : `Có sẵn: ${category === 'terminal' ? 'EN' : 'Ví'} · ${PRESET_LABELS[category]}`;
  }
  private unassigned(): string[] {
    return this.recent.filter((b: string): boolean => this.items.every((e: string): boolean => this.bundleOf(e) !== b));
  }

  @Builder
  appName(bundle: string) {
    Column({ space: 2 }) {
      Text(appDisplayName(bundle)).fontSize(15).maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis })
        .fontColor($r('sys.color.ohos_id_color_text_primary'))
      if (this.presetText(bundle).length > 0) {
        Text(this.presetText(bundle)).fontSize(11).fontColor('#126B60')
      }
      if (appDisplayName(bundle) !== bundle) {
        Text(bundle).fontSize(11).maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis })
          .fontColor($r('sys.color.ohos_id_color_text_secondary'))
      }
    }.alignItems(HorizontalAlign.Start).layoutWeight(1)
  }
  @Builder
  modeButton(label: string, selected: boolean, action: () => void) {
    Button(label).fontSize(13).height(32).width(56)
      .backgroundColor(selected ? '#126B60' : '#1F808080').fontColor(selected ? Color.White : '#126B60')
      .onClick(action)
  }

  build() {
    Column({ space: 8 }) {
      Text('Ứng dụng đã chọn').fontSize(14).fontWeight(FontWeight.Medium).fontColor($r('sys.color.ohos_id_color_text_primary'))
      List() {
        ForEach(this.items, (entry: string, index: number) => {
          ListItem() {
            Row({ space: 8 }) {
              this.appName(this.bundleOf(entry))
              this.modeButton('Ví', this.modeOf(entry) === 'VI', () => this.set(this.bundleOf(entry), 'VI'))
              this.modeButton('EN', this.modeOf(entry) === 'EN', () => this.set(this.bundleOf(entry), 'EN'))
              Button('Bỏ').fontSize(13).height(32).backgroundColor('#B3261E').onClick(() => this.remove(index))
            }.width('100%').height(52).padding({ left: 12, right: 8 })
          }
        }, (entry: string, index: number): string => index + ':' + entry)
      }.width('100%').height(Math.min(this.items.length, 6) * 52 + 8).visibility(this.items.length === 0 ? Visibility.None : Visibility.Visible)
      .padding({ top: 4, bottom: 4 }).borderRadius(12).backgroundColor($r('sys.color.ohos_id_color_card_bg'))
      .divider({ strokeWidth: 1, color: '#1F808080', startMargin: 12, endMargin: 12 })
      .scrollBar(BarState.Auto).edgeEffect(EdgeEffect.None)
      .nestedScroll({ scrollForward: NestedScrollMode.SELF_FIRST, scrollBackward: NestedScrollMode.SELF_FIRST })
      if (this.items.length === 0) {
        Text('Chưa chọn ứng dụng nào. Chọn từ danh sách bên dưới.').fontSize(13)
          .fontColor($r('sys.color.ohos_id_color_text_secondary')).padding({ left: 12, top: 4, bottom: 4 })
      }

      Row({ space: 8 }) {
        Text('Ứng dụng gần đây').fontSize(14).fontWeight(FontWeight.Medium).fontColor($r('sys.color.ohos_id_color_text_primary')).layoutWeight(1)
        Button('Làm mới').fontSize(13).height(32).backgroundColor('#FFFFFF').fontColor('#126B60').onClick(() => this.onRefresh())
        Button('Xóa danh sách').fontSize(13).height(32).backgroundColor('#8A8F94').onClick(() => this.onClearRecent())
      }.width('100%').margin({ top: 8 })
      Text('Những ứng dụng bạn đã gõ phím gần đây (khi tính năng đang bật). Mở ứng dụng, gõ vài chữ rồi bấm Làm mới.')
        .fontSize(12).fontColor($r('sys.color.ohos_id_color_text_secondary'))
      List() {
        ForEach(this.unassigned(), (bundle: string) => {
          ListItem() {
            Row({ space: 8 }) {
              this.appName(bundle)
              Button('Luôn Ví').fontSize(13).height(32).backgroundColor('#126B60').onClick(() => this.set(bundle, 'VI'))
              Button('Luôn EN').fontSize(13).height(32).backgroundColor('#23282E').onClick(() => this.set(bundle, 'EN'))
            }.width('100%').height(52).padding({ left: 12, right: 8 })
          }
        }, (bundle: string): string => bundle)
      }.width('100%').height(Math.min(this.unassigned().length, 5) * 52 + 8)
      .visibility(this.unassigned().length === 0 ? Visibility.None : Visibility.Visible)
      .padding({ top: 4, bottom: 4 }).borderRadius(12).backgroundColor($r('sys.color.ohos_id_color_card_bg'))
      .divider({ strokeWidth: 1, color: '#1F808080', startMargin: 12, endMargin: 12 })
      .scrollBar(BarState.Auto).edgeEffect(EdgeEffect.None)
      .nestedScroll({ scrollForward: NestedScrollMode.SELF_FIRST, scrollBackward: NestedScrollMode.SELF_FIRST })

      Row({ space: 8 }) {
        TextInput({ text: this.bundle, placeholder: 'Hoặc nhập mã ứng dụng: com.example.app' }).layoutWeight(1)
          .onChange((value: string) => { this.bundle = value; })
        Button('Luôn Ví').fontSize(13).backgroundColor('#126B60').onClick(() => { if (this.set(this.bundle, 'VI')) { this.bundle = ''; } })
        Button('Luôn EN').fontSize(13).backgroundColor('#23282E').onClick(() => { if (this.set(this.bundle, 'EN')) { this.bundle = ''; } })
      }.width('100%').margin({ top: 4 })
      if (this.message.length > 0) { Text(this.message).fontSize(12).fontColor('#126B60') }
    }.width('100%').alignItems(HorizontalAlign.Start)
  }
}
