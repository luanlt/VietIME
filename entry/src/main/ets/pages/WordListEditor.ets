// Editable list of short entries (English words, app bundle IDs): view, add, edit, delete.
// The parent owns the data; every change is reported through onChanged.
@Component
export struct WordListEditor {
  @Prop items: string[] = [];
  placeholder: string = '';
  lowercase: boolean = true;
  maxItems: number = 500;
  onChanged: (items: string[]) => void = (items: string[]): void => {};
  @State draft: string = '';
  @State editing: number = -1;
  @State editText: string = '';
  @State message: string = '';

  private norm(value: string): string {
    const text = value.trim().slice(0, 64);
    return this.lowercase ? text.toLowerCase() : text;
  }
  private add(): void {
    const fresh: string[] = [];
    for (const part of this.draft.split(',')) {
      const word = this.norm(part);
      if (word.length > 0 && !this.items.includes(word) && !fresh.includes(word)) { fresh.push(word); }
    }
    if (fresh.length === 0) { this.message = 'Không có mục mới (trống hoặc đã có trong danh sách).'; return; }
    if (this.items.length + fresh.length > this.maxItems) { this.message = `Tối đa ${this.maxItems} mục.`; return; }
    // Newest first, so additions are visible without scrolling the list.
    this.onChanged(fresh.concat(this.items));
    this.draft = ''; this.message = `Đã thêm ${fresh.length} mục.`;
  }
  private startEdit(index: number): void { this.editing = index; this.editText = this.items[index]; this.message = ''; }
  private saveEdit(index: number): void {
    const word = this.norm(this.editText);
    if (word.length === 0) { this.remove(index); return; }
    if (this.items.some((w: string, i: number): boolean => i !== index && w === word)) { this.message = `"${word}" đã có trong danh sách.`; return; }
    const next = this.items.slice(); next[index] = word;
    this.onChanged(next); this.editing = -1; this.message = 'Đã sửa.';
  }
  private remove(index: number): void {
    const word = this.items[index];
    this.onChanged(this.items.filter((w: string, i: number): boolean => i !== index));
    this.editing = -1; this.message = `Đã xóa "${word}".`;
  }

  build() {
    Column({ space: 8 }) {
      Row({ space: 8 }) {
        TextInput({ text: this.draft, placeholder: this.placeholder }).layoutWeight(1)
          .onChange((value: string) => { this.draft = value; }).onSubmit(() => this.add())
        Button('Thêm').onClick(() => this.add())
      }.width('100%')
      Text(`${this.items.length} mục · có thể thêm nhiều mục cùng lúc, cách nhau bằng dấu phẩy`).fontSize(12)
        .fontColor($r('sys.color.ohos_id_color_text_secondary'))
      // Scrolls inside a ~6-row box; at either end the page itself keeps scrolling.
      List() {
        ForEach(this.items, (word: string, index: number) => {
          ListItem() {
            Row({ space: 8 }) {
              if (this.editing === index) {
                TextInput({ text: this.editText }).layoutWeight(1).height(36)
                  .onChange((value: string) => { this.editText = value; }).onSubmit(() => this.saveEdit(index))
                Button('Lưu').fontSize(13).height(32).onClick(() => this.saveEdit(index))
                Button('Hủy').fontSize(13).height(32).backgroundColor('#8A8F94').onClick(() => { this.editing = -1; })
              } else {
                Text(word).fontSize(15).layoutWeight(1).fontColor($r('sys.color.ohos_id_color_text_primary'))
                Button('Sửa').fontSize(13).height(32).backgroundColor('#126B60').onClick(() => this.startEdit(index))
                Button('Xóa').fontSize(13).height(32).backgroundColor('#B3261E').onClick(() => this.remove(index))
              }
            }.width('100%').height(44).padding({ left: 12, right: 8 })
          }
        }, (word: string, index: number): string => index + ':' + word)
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
