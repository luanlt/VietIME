export enum InputMode { Vietnamese = 'VI', English = 'EN' }

// Words whose Telex reading is a rare or non-existent Vietnamese syllable (test -> tét).
// Common readings (rét, lít, Mĩ, mã) are deliberately excluded.
export const DEFAULT_ENGLISH_WORDS: string[] = ['test', 'text', 'next', 'taxi', 'box', 'cost', 'post', 'most',
  'yes', 'bye', 'user', 'meet', 'keep', 'deep', 'boot', 'root'];

export class EngineOptions {
  modernTone: boolean = true;
  freeTyping: boolean = true;
  restoreInvalid: boolean = true;
  autoUrl: boolean = true;
  autoEmail: boolean = true;
  // Switch a token to literal as soon as it cannot be Vietnamese, or matches englishWords.
  englishDetection: boolean = true;
  // Lower-case words typed as-is even though Telex could read them as Vietnamese.
  englishWords: string[] = DEFAULT_ENGLISH_WORDS.slice();
  // Repeated tone key: UniKey behaviour (ass -> as) instead of the raw keys (ass -> ass).
  uniKeyUndo: boolean = false;
  // Abbreviations expanded at the end of a word (lower-case key -> expansion), e.g. vn -> Việt Nam.
  macros: Map<string, string> = new Map<string, string>();
}

export class EngineResult {
  // passKey: the commit ends with the key itself (a digit or symbol), which the host may leave
  // to the editor so the character comes from the system keyboard layout, not from unicodeChar.
  constructor(public composition: string = '', public commit: string = '', public handled: boolean = true,
    public passKey: boolean = false) {}
}

export interface VietnameseInputEngine {
  processKey(key: string): EngineResult;
  reset(): void;
  setMode(mode: InputMode): void;
  getComposition(): string;
  finish(): string;
}
