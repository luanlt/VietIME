import { parseMacro } from '../settings/SettingsModel';

// Editable abbreviation list stored as "key=expansion": view, add, edit, delete.
// The parent owns the data; every change is reported through onChanged.
@Component
export struct MacroEditor {
  @Prop items: string[] = [];
  maxItems: number = 500;
  onChanged: (items: string[]) => void = (items: string[]): void => {};
  @State abbrev: string = '';
  @State expansion: string = '';
  @State editing: number = -1;
  @State message: string = '';

  private abbrevOf(entry: string): string { const m = parseMacro(entry); return m.length === 2 ? m[0] : ''; }
  private expansionOf(entry: string): string { const m = parseMacro(entry); return m.length === 2 ? m[1] : ''; }
  private submit(): void {
    const entry = this.abbrev.trim().toLowerCase() + '=' + this.expansion.trim();
    const macro = parseMacro(entry);
    if (macro.length !== 2) { this.message = 'Từ viết tắt chỉ gồm chữ a–z (tối đa 16), nội dung thay thế không được trống.'; return; }
    const clash = this.items.findIndex((m: string, i: number): boolean => i !== this.editing && this.abbrevOf(m) === macro[0]);
    if (clash >= 0) { this.message = `"${macro[0]}" đã có trong danh sách.`; return; }
    if (this.editing >= 0) {
      const next = this.items.slice(); next[this.editing] = macro[0] + '=' + macro[1];
      this.onChanged(next); this.message = 'Đã sửa.';
    } else {
      if (this.items.length >= this.maxItems) { this.message = `Tối đa ${this.maxItems} mục.`; return; }
      // Newest first, so additions are visible without scrolling the list.
      this.onChanged([macro[0] + '=' + macro[1]].concat(this.items)); this.message = `Đã thêm "${macro[0]}".`;
    }
    this.cancel();
  }
  private startEdit(index: number): void {
    this.editing = index; this.abbrev = this.abbrevOf(this.items[index]); this.expansion = this.expansionOf(this.items[index]); this.message = '';
  }
  private cancel(): void { this.editing = -1; this.abbrev = ''; this.expansion = ''; }
  private remove(index: number): void {
    const key = this.abbrevOf(this.items[index]);
    this.onChanged(this.items.filter((m: string, i: number): boolean => i !== index));
    this.cancel(); this.message = `Đã xóa "${key}".`;
  }

  build() {
    Column({ space: 8 }) {
      Row({ space: 8 }) {
        TextInput({ text: this.abbrev, placeholder: 'Viết tắt: vn' }).width(150)
          .onChange((value: string) => { this.abbrev = value; }).onSubmit(() => this.submit())
        TextInput({ text: this.expansion, placeholder: 'Thay bằng: Việt Nam' }).layoutWeight(1)
          .onChange((value: string) => { this.expansion = value; }).onSubmit(() => this.submit())
        Button(this.editing >= 0 ? 'Lưu' : 'Thêm').onClick(() => this.submit())
        if (this.editing >= 0) {
          Button('Hủy').backgroundColor('#8A8F94').onClick(() => this.cancel())
        }
      }.width('100%')
      Text(`${this.items.length} mục · gõ từ viết tắt rồi nhấn dấu cách hoặc dấu câu để thay`).fontSize(12)
        .fontColor($r('sys.color.ohos_id_color_text_secondary'))
      // Scrolls inside a ~6-row box; at either end the page itself keeps scrolling.
      List() {
        ForEach(this.items, (entry: string, index: number) => {
          ListItem() {
            Row({ space: 8 }) {
              Text(this.abbrevOf(entry)).fontSize(15).fontWeight(FontWeight.Medium).width(110).fontColor('#126B60')
              Text(this.expansionOf(entry)).fontSize(15).layoutWeight(1).maxLines(1)
                .textOverflow({ overflow: TextOverflow.Ellipsis }).fontColor($r('sys.color.ohos_id_color_text_primary'))
              Button('Sửa').fontSize(13).height(32).backgroundColor('#126B60').onClick(() => this.startEdit(index))
              Button('Xóa').fontSize(13).height(32).backgroundColor('#B3261E').onClick(() => this.remove(index))
            }.width('100%').height(44).padding({ left: 12, right: 8 })
          }
        }, (entry: string, index: number): string => index + ':' + entry)
      }.width('100%').height(Math.min(this.items.length, 6) * 44 + 8).visibility(this.items.length === 0 ? Visibility.None : Visibility.Visible)
      .padding({ top: 4, bottom: 4 }).borderRadius(12).backgroundColor($r('sys.color.ohos_id_color_card_bg'))
      .divider({ strokeWidth: 1, color: '#1F808080', startMargin: 12, endMargin: 12 })
      .scrollBar(BarState.Auto).edgeEffect(EdgeEffect.None)
      .nestedScroll({ scrollForward: NestedScrollMode.SELF_FIRST, scrollBackward: NestedScrollMode.SELF_FIRST })
      if (this.items.length === 0) {
        Text('Danh sách trống.').fontSize(13).fontColor($r('sys.color.ohos_id_color_text_secondary')).padding(12)
      }
      if (this.message.length > 0) { Text(this.message).fontSize(12).fontColor('#126B60') }
    }.width('100%').alignItems(HorizontalAlign.Start)
  }
}
