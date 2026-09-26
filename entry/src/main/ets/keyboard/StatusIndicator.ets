import { imeRuntime } from '../ime/ImeRuntime';

// Floating Ví / EN badge shown in the IME's STATUS_BAR panel.
// Tap toggles the mode; dragging moves the panel.
@Entry
@Component
struct StatusIndicator {
  @StorageLink('imeMode') mode: string = 'VI';
  // Bumped by the runtime on every show so a new frame is always painted.
  @StorageLink('indicatorFrame') frame: number = 0;

  build() {
    Stack() {
      Text(this.mode === 'EN' ? 'EN' : 'Ví')
        .fontSize(17).fontWeight(FontWeight.Medium).fontColor(Color.White)
    }
    .width('100%').height('100%').borderRadius(10).opacity(this.frame >= 0 ? 1 : 0.99)
    .backgroundColor(this.mode === 'EN' ? '#23282E' : '#0F6B5C')
    .gesture(GestureGroup(GestureMode.Exclusive,
      PanGesture({ distance: 4 }).onActionStart(() => imeRuntime.startMovingIndicator()),
      TapGesture().onAction(() => imeRuntime.toggleMode())))
  }
}
