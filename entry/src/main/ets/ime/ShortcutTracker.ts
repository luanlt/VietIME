// Framework-independent state machine. A Ctrl+Shift chord toggles on release only
// if no unrelated key was used, preserving e.g. Ctrl+Shift+Left and Ctrl+Shift+S.
export class ShortcutTracker {
  private candidate: boolean = false;
  private dirty: boolean = false;
  private fired: boolean = false;
  reset(): void { this.candidate = false; this.dirty = false; this.fired = false; }
  update(down: boolean, modifier: boolean, ctrl: boolean, shift: boolean, alt: boolean, logo: boolean): boolean {
    if (down && !modifier) { this.dirty = true; }
    if (ctrl && shift && !alt && !logo && !this.dirty) { this.candidate = true; }
    const toggle = !down && modifier && this.candidate && !this.dirty && !this.fired;
    if (toggle) { this.fired = true; }
    if (!ctrl && !shift) { this.reset(); }
    return toggle;
  }
}

// Tap of Shift alone toggles (HarmonyOS PC reserves Ctrl+Shift for switching input methods).
// Any other key or modifier pressed while Shift is held (e.g. typing capitals) cancels it.
export class ShiftTapTracker {
  private armed: boolean = false;
  reset(): void { this.armed = false; }
  update(down: boolean, isShift: boolean, ctrl: boolean, alt: boolean, logo: boolean): boolean {
    if (down) {
      this.armed = isShift && !ctrl && !alt && !logo && (this.armed || true);
      return false;
    }
    const toggle = isShift && this.armed;
    this.armed = false;
    return toggle;
  }
}
