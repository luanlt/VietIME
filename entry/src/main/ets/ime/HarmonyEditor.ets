import { inputMethodEngine } from '@kit.IMEKit';
import { EditorPort } from './CompositionSession';

export class HarmonyEditor implements EditorPort {
  private client: inputMethodEngine.InputClient;
  constructor(client: inputMethodEngine.InputClient) { this.client = client; }
  // Errors propagate to CompositionSession, which fails the session closed.
  preview(text: string): void { try { this.client.setPreviewTextSync(text, { start: -1, end: -1 }); } catch (error) { throw error as Error; } }
  finishPreview(): void { try { this.client.finishTextPreviewSync(); } catch (error) { throw error as Error; } }
  insert(text: string): void { try { this.client.insertTextSync(text); } catch (error) { throw error as Error; } }
  cursor(): number { try { return this.client.getTextIndexAtCursorSync(); } catch (error) { throw error as Error; } }
  // HarmonyOS deleteForward removes text before the caret, i.e. Backspace direction.
  deleteBefore(count: number): void { try { this.client.deleteForwardSync(count); } catch (error) { throw error as Error; } }
}
