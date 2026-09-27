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
// HarmonyOS auto-repeats a still-held Shift once the letter typed with it is released, so a
// repeated Shift down must never re-arm the tap (holding Shift after a capital switched to EN).
// A long hold is not a tap either: Shift+click / Shift+scroll never reach the IME.
export const SHIFT_TAP_MAX_MS: number = 500;
export class ShiftTapTracker {
  private armed: boolean = false;
  private held: boolean = false;
  private since: number = 0;
  // Keeps `held`: a Shift still held across a focus change must not arm on auto-repeat.
  reset(): void { this.armed = false; }
  update(down: boolean, isShift: boolean, ctrl: boolean, alt: boolean, logo: boolean, now: number = Date.now()): boolean {
    if (down) {
      if (isShift && !this.held) { this.held = true; this.armed = !ctrl && !alt && !logo; this.since = now; }
      else if (!isShift || ctrl || alt || logo) { this.armed = false; }
      return false;
    }
    if (!isShift) { this.armed = false; return false; }
    const toggle = this.armed && now - this.since <= SHIFT_TAP_MAX_MS;
    this.armed = false; this.held = false;
    return toggle;
  }
}
