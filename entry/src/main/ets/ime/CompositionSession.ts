import { TelexEngine } from '../engine/TelexEngine';
import { EngineOptions, InputMode } from '../engine/VietnameseInputEngine';

interface ErrorWithCode { code?: number; }

// Our own adapter contract, not a claimed HarmonyOS SDK interface.
export interface EditorPort {
  preview(text: string): void;
  finishPreview(): void;
  insert(text: string): void;
  cursor(): number;
  // Deletes `count` characters before the cursor (Backspace direction).
  deleteBefore(count: number): void;
}

export class CompositionSession {
  readonly engine: TelexEngine = new TelexEngine();
  private editor: EditorPort | undefined = undefined;
  private previewing: boolean = false;
  private expectedCursor: number = -1;
  private supported: boolean = false;
  private bypass: boolean = true;
  private failed: boolean = false;
  private changing: boolean = false;
  // Direct mode: editors without pre-edit (e.g. Android apps in EasyAbroad) receive
  // committed text; each key rewrites only the differing tail of the current word.
  private fallback: boolean = true;
  private shown: string = '';
  // Time of the last direct-mode write; bridged editors can report the caret several edits late.
  private lastEdit: number = 0;
  // Pre-edit: caret = previewStart + composition length. Verified once per editor; editors
  // that disagree fall back to reading the caret after every preview.
  private previewStart: number = -1;
  private caretChecked: boolean = false;
  private caretReadBack: boolean = false;
  // Smallest delete issued in direct mode (2 for Android apps via EasyAbroad, see replaceShown).
  private minDelete: number = 1;
  // Last character this session wrote right before the current word ('' when unknown).
  private before: string = '';
  // A single-character delete that could not be widened: caret expected after it, and the
  // text inserted with it, verified (and repaired if dropped) on the next key.
  private dropCheck: number = -1;
  private dropText: string = '';
  // Bridged editors can report the previous field's caret on the first read after a refocus
  // (ChatGPT after sending: 20 instead of 0). The first selection event (old -1) is the truth.
  private writes: number = 0;
  private attachCaret: number = -1;
  // Leave digits and symbols to the editor (system keyboard layout) instead of writing unicodeChar.
  private passSymbols: boolean = true;
  // Auto-capitalization, tracked from our own key stream only (editor text is never read):
  // after . ! ? and whitespace, and optionally at the very start of a field (caret 0).
  private autoCapitalize: boolean = false;
  private capitalizeFieldStart: boolean = false;
  private sentenceEnd: boolean = false;
  private capNext: boolean = false;
  private capAt: number = -1;
  private fieldStart: boolean = false;
  now: () => number = (): number => Date.now();

  attach(editor: EditorPort, supported: boolean, bypass: boolean): void {
    this.detach(); this.editor = editor; this.supported = supported; this.bypass = bypass;
    this.caretChecked = false; this.caretReadBack = false; this.fieldStart = true; this.writes = 0; this.attachCaret = -1;
  }
  setTyping(autoCapitalize: boolean, capitalizeFieldStart: boolean, passSymbols: boolean): void {
    this.autoCapitalize = autoCapitalize; this.capitalizeFieldStart = capitalizeFieldStart; this.passSymbols = passSymbols;
  }
  setMinDelete(count: number): void { this.minDelete = Math.max(1, count); }
  // Caret moved by navigation keys, clicks or shortcuts: the sentence context is unknown.
  forgetContext(): void { this.sentenceEnd = false; this.capNext = false; this.capAt = -1; this.fieldStart = false; }
  // Enter was passed to the editor after commit(); a line ending a sentence starts a new one.
  newLine(): void {
    const end = this.sentenceEnd; this.forgetContext();
    if (!this.autoCapitalize || !end) { return; }
    const caret = this.caret();
    this.capNext = true; this.capAt = caret < 0 ? -1 : caret + 1;
  }
  detach(): void {
    // inputStop means the framework owns disposal; no writes to a revoked client.
    this.editor = undefined; this.previewing = false; this.expectedCursor = -1;
    this.shown = ''; this.before = ''; this.dropCheck = -1; this.engine.reset(); this.failed = false; this.forgetContext();
  }
  configure(options: EngineOptions): void { this.engine.configure(options); }
  setDirectFallback(enabled: boolean): void { this.commit(); this.fallback = enabled; }
  setBypass(bypass: boolean): void { this.commit(); this.bypass = bypass; }
  setPolicy(supported: boolean, bypass: boolean): void { this.commit(); this.supported = supported; this.bypass = bypass; }
  setMode(mode: InputMode): void { this.commit(); this.engine.setMode(mode); }
  getMode(): InputMode { return this.engine.getMode(); }
  hasPreview(): boolean { return this.previewing; }
  isDirect(): boolean { return !this.supported && this.fallback; }
  isFailed(): boolean { return this.failed; }
  selectionChanged(start: number, end: number, oldStart: number = 0): void {
    // Direct mode edits emit several asynchronous selection events; the synchronous
    // cursor check in process() detects user moves instead.
    if (this.isDirect()) { if (oldStart === -1 && start === end) { this.rebase(start); } return; }
    if (!this.previewing || this.changing || (start === end && end === this.expectedCursor)) { return; }
    // Never replace a preview after a user moves/selects text. Finish in-place only.
    try { this.editor?.finishPreview(); } finally { this.clear(); }
  }
  private clear(): void {
    this.previewing = false; this.expectedCursor = -1; this.previewStart = -1; this.shown = ''; this.before = ''; this.dropCheck = -1; this.engine.reset();
  }
  commit(): void {
    if (this.editor && this.shown.length > 0 && !this.failed) {
      this.changing = true;
      try {
        if (this.cursorMoved()) { this.clear(); return; }
        this.replaceShown(this.engine.finish());
      } catch (error) { this.failed = true; throw error; }
      finally { this.clear(); this.changing = false; }
      return;
    }
    if (!this.editor || !this.previewing) { this.engine.reset(); this.shown = ''; this.before = ''; this.attachCaret = -1; return; }
    this.changing = true;
    try {
      if (this.editor.cursor() === this.expectedCursor) { this.editor.preview(this.engine.finish()); }
      this.editor.finishPreview();
    } catch (error) { this.failed = true; throw error; }
    finally { this.clear(); this.changing = false; }
  }
  process(key: string): boolean {
    const editor = this.editor;
    if (!editor || this.failed || this.bypass || this.engine.getMode() === InputMode.English) { return false; }
    if (!this.supported && !this.fallback) { return false; }
    const typed = this.autoCapitalize ? this.capitalize(key) : key;
    const handled = this.supported ? this.processPreEdit(editor, typed) : this.processDirect(typed);
    if (this.autoCapitalize) { this.track(key); }
    return handled;
  }
  private capitalize(key: string): string {
    if (key.length !== 1 || key === key.toUpperCase() || this.engine.inWord() || this.shown.length > 0 || this.previewing) { return key; }
    let cap = false;
    if (this.capNext) { cap = this.caret() === this.capAt && !this.jumped(); }
    else if (this.fieldStart && this.capitalizeFieldStart) { cap = this.safeCursor() === 0; }
    return cap ? key.toUpperCase() : key;
  }
  private track(key: string): void {
    if (key.length === 1 && '.!?…'.includes(key)) { this.sentenceEnd = true; this.capNext = false; this.fieldStart = false; return; }
    // Closing quotes/brackets after a full stop keep the sentence ending: Xong." Tiếp
    if (key.length === 1 && '"\')]”’»'.includes(key) && this.sentenceEnd) { return; }
    if (key === ' ' || key === '\t') {
      const end = this.sentenceEnd || this.capNext; this.forgetContext();
      if (end) { this.capNext = true; this.capAt = this.caret(); }
      return;
    }
    this.forgetContext();
  }
  // Caret as this session sees it: computed in direct mode (bridged editors report it late).
  private caret(): number { return this.isDirect() ? this.expectedCursor : this.safeCursor(); }
  // Direct mode: a click since the sentence ended moves the real caret away from the computed one.
  private jumped(): boolean {
    if (!this.isDirect() || this.capAt < 0) { return false; }
    const now = this.safeCursor();
    return now >= 0 && (now > this.capAt + 2 || (now < this.capAt - 1 && !this.lagging(now)));
  }
  private processPreEdit(editor: EditorPort, key: string): boolean {
    // Editor deletes committed text itself; the next key starts a fresh token.
    if (key === 'Backspace' && !this.previewing) { this.engine.reset(); return false; }
    if (key === 'Escape' && !this.previewing) { return false; }
    if (this.previewing && editor.cursor() !== this.expectedCursor) {
      editor.finishPreview(); this.clear();
    }
    this.changing = true;
    try {
      const result = this.engine.processKey(key);
      if (!result.handled) { return false; }
      // Swallowed key (third tone press): nothing to write.
      if (!this.previewing && result.commit.length === 0 && result.composition.length === 0) { return true; }
      if (!this.previewing && result.commit.length === 0 && result.composition.length > 0) { this.previewStart = editor.cursor(); }
      if (result.commit.length > 0) {
        const pass = this.passSymbols && result.passKey;
        const text = pass ? result.commit.slice(0, result.commit.length - key.length) : result.commit;
        if (this.previewing) { editor.preview(text); editor.finishPreview(); }
        else if (text.length > 0) { editor.insert(text); }
        this.previewing = false;
        // The editor inserts the symbol itself when the key event is returned unhandled.
        if (pass) { this.expectedCursor = -1; return false; }
      } else {
        editor.preview(result.composition);
        this.previewing = result.composition.length > 0;
        if (!this.previewing) { editor.finishPreview(); }
      }
      if (!this.previewing) { this.expectedCursor = -1; return true; }
      const computed = this.previewStart + result.composition.length;
      if (this.caretReadBack || !this.caretChecked) {
        this.expectedCursor = editor.cursor();
        if (!this.caretChecked) { this.caretChecked = true; this.caretReadBack = this.expectedCursor !== computed; }
      } else { this.expectedCursor = computed; }
      return true;
    } catch (error) {
      // Editor advertised pre-edit but rejected it (12800011) before anything was written:
      // switch this session to direct typing and replay the key.
      if (!this.previewing && this.fallback && (error as ErrorWithCode).code === 12800011) {
        this.changing = false; this.supported = false; this.clear();
        this.trace('preview rejected: direct mode');
        return this.processDirect(key);
      }
      // A call may have mutated the editor before an IPC error. Never retry/delete blindly.
      this.failed = true; this.clear(); throw error;
    } finally { this.changing = false; }
  }
  // Optional numeric trace hook (lengths/indices only) for on-device diagnosis.
  trace: (message: string) => void = (message: string): void => {};
  // Debug builds only: allows extra caret reads for the trace.
  tracing: boolean = false;
  private processDirect(key: string): boolean {
    try { this.repairDroppedDelete(); } catch (error) { this.failed = true; this.clear(); throw error; }
    // A click or external edit moved the caret: start a new word, never delete there.
    if (this.shown.length > 0 && this.cursorMoved()) { this.trace('direct reset: caret moved'); this.clear(); }
    else if (this.shown.length === 0 && this.expectedCursor >= 0) {
      // Between words keep the computed caret unless the caret clearly jumped elsewhere.
      const now = this.safeCursor();
      const behind = now < this.expectedCursor - 1 && !this.lagging(now);
      if (now >= 0 && (behind || now > this.expectedCursor + 2)) { this.expectedCursor = now; this.before = ''; }
    }
    if ((key === 'Backspace' || key === 'Escape') && this.shown.length === 0) { this.engine.reset(); this.expectedCursor = -1; this.before = ''; this.attachCaret = -1; return false; }
    this.changing = true;
    try {
      const result = this.engine.processKey(key);
      if (!result.handled) { return false; }
      // The engine resets itself on commit but keeps literal (English) state until whitespace.
      if (result.commit.length > 0) {
        const pass = this.passSymbols && result.passKey;
        const text = pass ? result.commit.slice(0, result.commit.length - key.length) : result.commit;
        this.replaceShown(text); this.shown = '';
        // The editor inserts the symbol itself: keep the computed caret in step with it.
        if (pass) {
          if (this.expectedCursor >= 0) { this.expectedCursor += key.length; }
          this.lastEdit = this.now(); this.before = ''; this.attachCaret = -1; return false;
        }
        // The next word starts right after text we wrote: remember its last character.
        this.before = text.length > 0 ? text.charAt(text.length - 1) : this.before;
      }
      else { this.replaceShown(result.composition); }
      return true;
    } catch (error) {
      this.failed = true; this.clear(); throw error;
    } finally { this.changing = false; }
  }
  // Rewrites the current word from `shown` to `next` with minimal deletes/inserts.
  private replaceShown(next: string): void {
    const editor = this.editor;
    if (!editor) { return; }
    const old = this.shown;
    let same = 0;
    while (same < old.length && same < next.length && old.charAt(same) === next.charAt(same)) { same++; }
    let del = old.length - same;
    let lead = '';
    // Some bridged editors drop single-character deletes (EasyAbroad: about half of them in
    // Teams): rewrite at least minDelete characters, borrowing the character written just
    // before the word (usually our space) for one-letter words.
    if (del > 0 && del < this.minDelete) {
      const extra = Math.min(this.minDelete - del, same); same -= extra; del += extra;
      if (del < this.minDelete && same === 0 && this.before.length > 0) { lead = this.before; del += lead.length; }
    }
    const text = lead + next.slice(same);
    // Bridged editors report the caret asynchronously (one edit behind), so the
    // expected caret is computed arithmetically instead of read back after writing.
    const base = this.expectedCursor >= 0 ? this.expectedCursor : (this.writes === 0 && this.attachCaret >= 0 ? this.attachCaret : this.safeCursor());
    if (del > 0 || text.length > 0) { this.writes++; }
    if (this.tracing) {
      this.trace(`write del=${del} ins=${text.length} base=${base}` + (del > 0 ? ` caret=${this.safeCursor()}` : ''));
    }
    if (del > 0) { editor.deleteBefore(del); }
    if (text.length > 0) { editor.insert(text); }
    this.shown = next; this.lastEdit = this.now();
    this.expectedCursor = base < 0 ? -1 : base - del + text.length;
    this.dropCheck = del === 1 && this.minDelete > 1 && text.length > 0 ? this.expectedCursor : -1;
    this.dropText = text;
  }
  // First caret event of the field: before any write it is the base; right after the first
  // write it corrects a base read from a stale caret (every tracked position moves with it).
  private rebase(caret: number): void {
    if (this.writes === 0) { this.attachCaret = caret; return; }
    if (this.writes !== 1 || this.expectedCursor < 0) { return; }
    const delta = caret - this.expectedCursor;
    if (delta === 0) { return; }
    this.trace(`rebase ${delta}`);
    this.expectedCursor += delta;
    if (this.capAt >= 0) { this.capAt += delta; }
    if (this.dropCheck >= 0) { this.dropCheck += delta; }
  }
  // The caret one past where it should be, right after an unwidened single delete, means the
  // editor dropped that delete: remove the stale character with a (reliable) longer delete.
  private repairDroppedDelete(): void {
    const expected = this.dropCheck;
    this.dropCheck = -1;
    const editor = this.editor;
    if (!editor || expected < 0 || this.expectedCursor !== expected) { return; }
    if (this.safeCursor() !== expected + 1) { return; }
    this.trace('repair dropped delete');
    editor.deleteBefore(this.dropText.length + 1);
    editor.insert(this.dropText);
    this.lastEdit = this.now();
  }
  // Behind the caret within 600 ms of our own write: the editor has not caught up yet.
  private lagging(now: number): boolean {
    return this.now() - this.lastEdit < 600 && now >= this.expectedCursor - 32;
  }
  // Some bridged editors cannot report a caret; -1 disables the move check.
  private safeCursor(): number { try { return this.editor?.cursor() ?? -1; } catch (error) { return -1; } }
  private cursorMoved(): boolean {
    if (this.expectedCursor < 0) { return false; }
    const now = this.safeCursor();
    if (now < 0) { return false; }
    // A lagging read lands behind the caret (inside the word, or further back right after
    // fast typing); a click lands elsewhere.
    if (now > this.expectedCursor + 2) { return true; }
    if (now < this.expectedCursor - this.shown.length - 1 && !this.lagging(now)) { return true; }
    // Reads never run ahead of the editor: a larger value corrects a stale word base.
    if (now > this.expectedCursor) { this.expectedCursor = now; }
    return false;
  }
}
