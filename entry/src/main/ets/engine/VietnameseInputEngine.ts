export enum InputMode { Vietnamese = 'VI', English = 'EN' }

// Words whose Telex reading is a rare or non-existent Vietnamese syllable (test -> tét).
// Common readings (rét, lít, Mĩ, mã) are deliberately excluded.
// Frequent syllables are left out even when the English word is common (this -> thí, its -> ít,
// max -> mã, six -> sĩ, did -> đi), so Vietnamese always wins for them.
// Added in list version 2; merged once into saved lists (SettingsRepository).
export const ENGLISH_WORDS_V2: string[] = ['is', 'us', 'or', 'if', 'her', 'per', 'was', 'has', 'does', 'goes', 'says',
  'more', 'core', 'how', 'now', 'two', 'see', 'seen', 'seem', 'soon', 'door', 'poor', 'room', 'rooms', 'data', 'past',
  'best', 'dist', 'gets', 'tips', 'air', 'pair', 'os', 'ux', 'aws'];
// Version 3: words ending in a doubled tone letter, kept English although ss/ff/rr now undo the tone (oss -> os).
export const ENGLISH_WORDS_V3: string[] = ['boss', 'less', 'miss', 'kiss', 'pass', 'loss', 'toss', 'mass', 'off',
  'offline', 'offset', 'password', 'passport'];
export const ENGLISH_WORDS_VERSION: number = 3;
export const DEFAULT_ENGLISH_WORDS: string[] = ['test', 'text', 'next', 'taxi', 'box', 'cost', 'post', 'most',
  'yes', 'bye', 'user', 'meet', 'keep', 'deep', 'boot', 'root'].concat(ENGLISH_WORDS_V2, ENGLISH_WORDS_V3);

export class EngineOptions {
  modernTone: boolean = true;
  // Tone keys on a syllable that is not yet valid (viejet -> việt) and a late d (dinhd -> đinh).
  freeTyping: boolean = true;
  // z removes the tone mark (toans z -> toan); off: z is an ordinary letter.
  zRemovesTone: boolean = true;
  restoreInvalid: boolean = true;
  autoUrl: boolean = true;
  autoEmail: boolean = true;
  // Switch a token to literal as soon as it cannot be Vietnamese, or matches englishWords.
  englishDetection: boolean = true;
  // Lower-case words typed as-is even though Telex could read them as Vietnamese.
  englishWords: string[] = DEFAULT_ENGLISH_WORDS.slice();
  // Tone key repeated later in the word undoes the tone too (tests -> tets); a double press always does (oss -> os).
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
