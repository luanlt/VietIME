import { inputMethodEngine } from '@kit.IMEKit';
import { EditorPort } from './CompositionSession';

// Per-editor workarounds, see ImeRuntime.editorQuirks.
export class EditorQuirks {
  // Wait this long after a delete before the next write (0: write at once).
  settleMs: number = 0;
  // The editor's caret index is meaningless (always 0): report it as unknown.
  blindCaret: boolean = false;
}

export class HarmonyEditor implements EditorPort {
  private client: inputMethodEngine.InputClient;
  private quirks: EditorQuirks;
  private queue: (() => void)[] = [];
  private settling: boolean = false;
  onDeferredError: (error: Error) => void = (error: Error): void => {};
  constructor(client: inputMethodEngine.InputClient, quirks: EditorQuirks = new EditorQuirks()) {
    this.client = client; this.quirks = quirks;
  }
  // Errors propagate to CompositionSession, which fails the session closed.
  preview(text: string): void { try { this.client.setPreviewTextSync(text, { start: -1, end: -1 }); } catch (error) { throw error as Error; } }
  finishPreview(): void { try { this.client.finishTextPreviewSync(); } catch (error) { throw error as Error; } }
  insert(text: string): void { this.run((): void => { this.client.insertTextSync(text); }, false); }
  cursor(): number {
    if (this.quirks.blindCaret) { return -1; }
    try { return this.client.getTextIndexAtCursorSync(); } catch (error) { throw error as Error; }
  }
  // HarmonyOS deleteForward removes text before the caret, i.e. Backspace direction.
  deleteBefore(count: number): void { this.run((): void => { this.client.deleteForwardSync(count); }, true); }
  // Writes run in order; after a delete, later writes wait settleMs (queued, errors reported late).
  private run(op: () => void, isDelete: boolean): void {
    if (this.settling) { this.queue.push(op); if (isDelete) { this.queue.push((): void => { this.pause(); }); } return; }
    try { op(); } catch (error) { throw error as Error; }
    if (isDelete && this.quirks.settleMs > 0) { this.pause(); }
  }
  private pause(): void {
    this.settling = true;
    setTimeout((): void => { this.drain(); }, this.quirks.settleMs);
  }
  private drain(): void {
    this.settling = false;
    while (this.queue.length > 0 && !this.settling) {
      const op = this.queue.shift() as () => void;
      try { op(); } catch (error) { this.queue = []; this.onDeferredError(error as Error); return; }
    }
  }
}
