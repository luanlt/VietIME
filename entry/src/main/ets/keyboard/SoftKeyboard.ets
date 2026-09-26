import { imeRuntime } from '../ime/ImeRuntime';

@Entry
@Component
struct SoftKeyboard {
  @State shifted: boolean = false;
  @StorageLink('imeMode') mode: string = 'VI';
  @StorageLink('keyLabelSize') labelSize: number = 20;
  @StorageLink('imeState') state: string = 'Đang khởi động';
  private rows: string[] = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  build() {
    Column({ space: 7 }) {
      Row() {
        Text('VietIME').fontSize(14).fontWeight(FontWeight.Bold).fontColor('#126B60')
        Blank()
        Text(this.state).fontSize(11).fontColor('#5E6F68')
        Button('Ẩn').fontSize(12).margin({ left: 16 }).onClick(() => imeRuntime.hidePanel())
      }.height(30).width('100%')
      ForEach(this.rows, (row: string) => {
        Row({ space: 5 }) {
          ForEach(row.split(''), (key: string) => {
            Button(this.shifted ? key.toUpperCase() : key).fontSize(this.labelSize)
              .fontColor('#172E26').backgroundColor('#FFFFFF').borderRadius(7).layoutWeight(1).height('100%')
              .onClick(() => { imeRuntime.softKey(this.shifted ? key.toUpperCase() : key); this.shifted = false; })
          })
        }.width('100%').layoutWeight(1)
      })
      Row({ space: 5 }) {
        Button(this.shifted ? '⇧ HOA' : '⇧').onClick(() => this.shifted = !this.shifted).layoutWeight(1)
        Button(this.mode).onClick(() => imeRuntime.toggleMode()).layoutWeight(1)
        Button('Dấu cách').onClick(() => imeRuntime.softKey(' ')).layoutWeight(3)
        Button('⌫').onClick(() => imeRuntime.softKey('Backspace')).layoutWeight(1)
        Button('↵').onClick(() => imeRuntime.softKey('Enter')).layoutWeight(1)
      }.width('100%').layoutWeight(1)
    }.padding(12).width('100%').height('100%').backgroundColor('#E5ECE7')
  }
}
