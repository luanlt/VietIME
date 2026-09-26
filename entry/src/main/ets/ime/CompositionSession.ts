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
  now: () => number = (): number => Date.now();

  attach(editor: EditorPort, supported: boolean, bypass: boolean): void {
    this.detach(); this.editor = editor; this.supported = supported; this.bypass = bypass;
    this.caretChecked = false; this.caretReadBack = false;
  }
  detach(): void {
    // inputStop means the framework owns disposal; no writes to a revoked client.
    this.editor = undefined; this.previewing = false; this.expectedCursor = -1;
    this.shown = ''; this.engine.reset(); this.failed = false;
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
  selectionChanged(start: number, end: number): void {
    // Direct mode edits emit several asynchronous selection events; the synchronous
    // cursor check in process() detects user moves instead.
    if (this.isDirect()) { return; }
    if (!this.previewing || this.changing || (start === end && end === this.expectedCursor)) { return; }
    // Never replace a preview after a user moves/selects text. Finish in-place only.
    try { this.editor?.finishPreview(); } finally { this.clear(); }
  }
  private clear(): void { this.previewing = false; this.expectedCursor = -1; this.previewStart = -1; this.shown = ''; this.engine.reset(); }
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
    if (!this.editor || !this.previewing) { this.engine.reset(); this.shown = ''; return; }
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
    if (!this.supported) { return this.fallback ? this.processDirect(key) : false; }
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
      if (!this.previewing && result.commit.length === 0 && result.composition.length > 0) { this.previewStart = editor.cursor(); }
      if (result.commit.length > 0) {
        if (this.previewing) { editor.preview(result.commit); editor.finishPreview(); }
        else { editor.insert(result.commit); }
        this.previewing = false;
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
  private processDirect(key: string): boolean {
    // A click or external edit moved the caret: start a new word, never delete there.
    if (this.shown.length > 0 && this.cursorMoved()) { this.trace('direct reset: caret moved'); this.clear(); }
    else if (this.shown.length === 0 && this.expectedCursor >= 0) {
      // Between words keep the computed caret unless the caret clearly jumped elsewhere.
      const now = this.safeCursor();
      const behind = now < this.expectedCursor - 1 && !this.lagging(now);
      if (now >= 0 && (behind || now > this.expectedCursor + 2)) { this.expectedCursor = now; }
    }
    if ((key === 'Backspace' || key === 'Escape') && this.shown.length === 0) { this.engine.reset(); this.expectedCursor = -1; return false; }
    this.changing = true;
    try {
      const result = this.engine.processKey(key);
      if (!result.handled) { return false; }
      // The engine resets itself on commit but keeps literal (English) state until whitespace.
      if (result.commit.length > 0) { this.replaceShown(result.commit); this.shown = ''; }
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
    // Bridged editors report the caret asynchronously (one edit behind), so the
    // expected caret is computed arithmetically instead of read back after writing.
    const base = this.expectedCursor >= 0 ? this.expectedCursor : this.safeCursor();
    if (old.length > same) { editor.deleteBefore(old.length - same); }
    if (next.length > same) { editor.insert(next.slice(same)); }
    this.shown = next; this.lastEdit = this.now();
    this.expectedCursor = base < 0 ? -1 : base - (old.length - same) + (next.length - same);
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
