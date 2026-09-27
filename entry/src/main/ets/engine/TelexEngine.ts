import { EngineOptions, EngineResult, InputMode, VietnameseInputEngine } from './VietnameseInputEngine';
import { isViablePrefix, isVowel, parseSyllable, promoteCircumflex, stripTone, toneChar, toneFits, toneIndex, withCase } from './Syllable';

export class TelexEngine implements VietnameseInputEngine {
  private letters: string[] = [];
  private raw: string = '';
  // Keys as typed minus the keys spent undoing a modifier (ww -> w, aaa -> aa): the text a
  // token falls back to when it turns out to be English (wwindows -> windows, not wwindows).
  private plain: string = '';
  private tone: number = 0;
  private mode: InputMode = InputMode.Vietnamese;
  private literal: boolean = false;
  private escaped: boolean = false;
  private lastModifier: string = '';
  private beforeModifier: string[] = [];
  // Tone key swallowed once after a repeated-tone restore: UniKey habit off+f -> off, not offf.
  private absorb: string = '';
  // Tone key just undone by a double press (oss -> os); the token keeps no further Telex rules.
  private undone: string = '';
  // Letters typed after the undone pair (tess + t), kept without Telex rules.
  private undoneMore: boolean = false;
  private options: EngineOptions;

  constructor(options: EngineOptions = new EngineOptions()) { this.options = options; }
  configure(options: EngineOptions): void { this.options = options; }
  setMode(mode: InputMode): void { this.reset(); this.mode = mode; }
  getMode(): InputMode { return this.mode; }
  getRaw(): string { return this.raw; }
  reset(): void {
    this.letters = []; this.raw = ''; this.plain = ''; this.tone = 0; this.literal = false; this.escaped = false;
    this.lastModifier = ''; this.beforeModifier = []; this.absorb = ''; this.undone = ''; this.undoneMore = false;
  }
  // Inside a word (composing or a literal English token), where auto-capitalization never applies.
  inWord(): boolean { return this.raw.length > 0 || this.literal; }
  // Letters as shown: a tone mark implies the circumflex of ie/uo (vietj -> việt, muons -> muốn).
  private shaped(): string[] { return this.tone !== 0 ? promoteCircumflex(this.letters) : this.letters; }
  getComposition(): string {
    const letters = this.shaped();
    const at = toneIndex(letters, this.options.modernTone);
    return letters.map((char: string, index: number): string => index === at ? toneChar(char, this.tone) : char).join('');
  }
  finish(): string {
    const macro = this.expandMacro();
    if (macro !== undefined) { this.reset(); return macro; }
    if (this.undone !== '') {
      // Listed words with a doubled tone letter stay English (boss, off, offline); others as UniKey (os, test).
      const list = this.options.englishWords;
      const word = list.includes(this.raw.toLowerCase()) ? this.raw : (list.includes(this.plain.toLowerCase()) ? this.plain : this.letters.join(''));
      this.reset(); return word;
    }
    const preserve = this.escaped || this.letters.join('').toLowerCase() === 'đ';
    // Listed English words are checked only at the word end so prefixes like meet(j) -> mệt still work.
    // The list applies even with detection off: the user asked for these words explicitly.
    const english = this.options.englishWords.includes(this.raw.toLowerCase());
    const invalid = !parseSyllable(this.shaped()).valid || !toneFits(this.letters, this.tone);
    const result = english || (this.options.restoreInvalid && !preserve && invalid) ? this.raw : this.getComposition();
    this.reset();
    return result;
  }
  // Expansion follows the typed case: vn -> Việt Nam, Ko -> Không, KO -> KHÔNG.
  private expandMacro(): string | undefined {
    if (this.options.macros.size === 0 || this.raw.length === 0) { return undefined; }
    const value = this.options.macros.get(this.raw.toLowerCase());
    if (value === undefined) { return undefined; }
    if (this.raw.length > 1 && this.raw === this.raw.toUpperCase()) { return value.toUpperCase(); }
    const first = this.raw.charAt(0);
    return first !== first.toLowerCase() ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }
  // A token that may still become a macro key is never switched to literal English.
  private macroPrefix(): boolean {
    if (this.options.macros.size === 0) { return false; }
    const low = this.raw.toLowerCase();
    for (const key of this.options.macros.keys()) { if (key.startsWith(low)) { return true; } }
    return false;
  }
  private applyModifier(key: string): boolean {
    if (key !== '' && key === this.lastModifier) {
      // Undoing the w shorthand (Ww -> W) keeps the case of the ư it replaces.
      const added = this.letters.length > this.beforeModifier.length ? this.letters[this.letters.length - 1] : '';
      this.letters = this.beforeModifier.slice();
      this.letters.push(withCase(added !== '' ? added : this.raw.charAt(this.raw.length - 1), key));
      this.plain = this.plain.slice(0, this.plain.length - 1);
      this.lastModifier = ''; this.beforeModifier = [];
      this.escaped = true;
      return true;
    }
    const prior = this.letters.slice();
    let changed = false;
    const syllable = parseSyllable(this.letters);
    if (key === 'd') {
      // UniKey-style: d anywhere in the word turns a leading d into đ (dinhd -> đinh).
      const rest = this.letters.slice(1);
      if (this.letters.length >= 1 && (this.options.freeTyping || this.letters.length === 1) && this.letters[0].toLowerCase() === 'd' &&
        (rest.length === 0 || isViablePrefix(['đ'].concat(rest)))) {
        this.letters[0] = withCase(this.letters[0], 'đ'); changed = true;
      }
    } else if (key === 'w') {
      const low = this.letters.join('').toLowerCase();
      if (low.includes('ươ') && this.lastModifier !== 'w') { return true; }
      if (syllable.nucleus === 'ua') {
        this.letters[syllable.start] = withCase(this.letters[syllable.start], 'ư');
        this.beforeModifier = prior; this.lastModifier = key; return true;
      }
      const pair = Math.max(low.lastIndexOf('uo'), low.lastIndexOf('uơ'), low.lastIndexOf('ưo'));
      if (pair >= syllable.start && pair >= 0 && !(pair === 1 && low.startsWith('qu'))) {
        this.letters[pair] = withCase(this.letters[pair], 'ư');
        this.letters[pair + 1] = withCase(this.letters[pair + 1], 'ơ'); changed = true;
      } else {
        for (let i = syllable.end - 1; i >= syllable.start && i >= 0; i--) {
          const base = this.letters[i].toLowerCase();
          const pos = 'auo'.indexOf(base);
          if (pos >= 0) { this.letters[i] = withCase(this.letters[i], 'ăươ'.charAt(pos)); changed = true; break; }
        }
        // Telex shorthand: w with no vowel yet is ư (nhw -> như, ngwx -> ngữ); ww undoes it.
        if (!changed && syllable.start < 0 && isViablePrefix(this.letters.concat(['ư']))) {
          this.letters.push(withCase(this.raw.charAt(this.raw.length - 1), 'ư')); changed = true;
        }
      }
    } else if ('aeo'.includes(key)) {
      for (let i = syllable.end - 1; i >= syllable.start && i >= 0; i--) {
        if (this.letters[i].toLowerCase() === key) {
          this.letters[i] = withCase(this.letters[i], 'âêô'.charAt('aeo'.indexOf(key)));
          changed = true; break;
        }
      }
    }
    if (changed) { this.beforeModifier = prior; this.lastModifier = key; }
    return changed;
  }
  processKey(key: string): EngineResult {
    const absorb = this.absorb; this.absorb = '';
    if (key === 'Backspace') {
      if (this.letters.length === 0) { return new EngineResult('', '', false); }
      this.letters.pop();
      if (!this.letters.some((char: string): boolean => isVowel(char))) { this.tone = 0; }
      this.raw = this.getComposition(); this.plain = this.raw; this.lastModifier = ''; this.beforeModifier = []; this.undone = ''; this.undoneMore = false;
      return new EngineResult(this.getComposition());
    }
    if (key === 'Escape') {
      const raw = this.raw; this.reset(); return new EngineResult('', raw);
    }
    if (this.mode === InputMode.English) { return new EngineResult('', key); }
    if (absorb !== '' && key.toLowerCase() === absorb) { return new EngineResult('', ''); }
    const letter = key.length === 1 && /[a-zA-ZđĐăĂâÂêÊôÔơƠưƯ]/.test(key);
    const space = /\s/.test(key);
    if (this.literal) {
      if (space) { this.reset(); }
      return new EngineResult('', key, true, !letter && !space);
    }
    // Bound both memory and per-key work for long identifiers or pasted-like streams.
    if (this.raw.length >= 128) {
      const text = this.raw + key; this.reset(); this.literal = !/\s/.test(key);
      return new EngineResult('', text);
    }
    if (!letter) {
      // ':' marks a scheme/drive only after an untransformed token (http:, C:); "chús:" stays Vietnamese.
      const colonScheme = key === ':' && this.getComposition() === this.raw;
      const technical = (this.options.autoUrl && ('/\\_='.includes(key) || /[0-9]/.test(key) || colonScheme)) || (this.options.autoEmail && key === '@');
      const text = technical ? this.raw : this.finish();
      this.reset(); this.literal = technical;
      return new EngineResult('', text + key, true, !space);
    }
    this.raw += key; this.plain += key;
    const lower = key.toLowerCase();
    if (this.undone !== '') {
      // A third press types the key again (osss -> oss) and is dropped from an English word (offfice).
      if (!this.undoneMore && lower === this.undone) { this.letters.push(key); this.plain = this.plain.slice(0, this.plain.length - 1); return new EngineResult(this.getComposition()); }
      // A vowel right after the pair is an English doubled consonant (office, error, message); a consonant
      // is the UniKey habit of removing a tone mid-word (tess+t -> test), the letters are kept as typed.
      if (!this.undoneMore && isVowel(lower)) { return this.toLiteral(this.plain); }
      this.undoneMore = true; this.letters.push(key);
      return new EngineResult(this.getComposition());
    }
    const tone = 'sfrxj'.indexOf(lower) + 1;
    // Validity as the tone would render it: vietj is việt even with free typing off.
    const syllable = parseSyllable(promoteCircumflex(this.letters));
    if (tone > 0 && syllable.start >= 0 && (this.options.freeTyping || syllable.valid)) {
      if (this.tone === tone && this.options.uniKeyUndo) {
        // UniKey: a repeated tone key removes the tone and types the key itself (ass -> as).
        this.tone = 0; return this.toLiteral(this.getComposition() + key);
      }
      // Pressed twice in a row, like UniKey/OpenKey: remove the tone and keep one key (oss -> os).
      // The token then waits: more letters mean an English word (office, error), see `undone`.
      if (this.options.englishDetection && this.tone === tone && this.raw.charAt(this.raw.length - 2).toLowerCase() === lower) {
        this.tone = 0; this.letters.push(key); this.undone = lower; this.lastModifier = ''; this.beforeModifier = [];
        return new EngineResult(this.getComposition());
      }
      // A tone key repeated later in the word means "not Vietnamese": give back what was typed (tests).
      // A third press right after is the UniKey habit of "remove the tone": swallow it.
      if (this.options.englishDetection && this.tone === tone) {
        const result = this.toLiteral(this.plain); this.absorb = lower; return result;
      }
      this.tone = this.tone === tone ? 0 : tone;
      this.lastModifier = ''; return this.checked();
    }
    if (lower === 'z' && this.tone !== 0 && this.options.zRemovesTone) {
      // z removes only the tone: an implied circumflex stays (vietjz -> viêt, like vieetjz).
      this.letters = this.shaped(); this.tone = 0; this.lastModifier = ''; return this.checked();
    }
    // Modifiers only need a syllable that can still be completed (tie + e -> tiê); free typing
    // additionally allows a late d (dinhd -> đinh) and tone keys on unfinished syllables.
    if ('adeow'.includes(lower) && (this.options.freeTyping || isViablePrefix(this.letters)) && this.applyModifier(lower)) {
      return this.checked();
    }
    this.lastModifier = ''; this.beforeModifier = [];
    this.letters.push(stripTone(key));
    // Normalize ưo to ươ once the second vowel arrives (duwowng remains accepted).
    const n = this.letters.length;
    if (n >= 2 && this.letters[n - 2].toLowerCase() === 'ư' && lower === 'o') {
      this.letters[n - 1] = withCase(key, 'ơ');
    }
    return this.checked();
  }
  // English detection: once the token cannot be Vietnamese,
  // emit the typed keys and keep the rest of the token literal until whitespace.
  // Escaped tokens are checked too: ww + indows is English, never w + índow (UniKey habit ww, ss).
  private checked(): EngineResult {
    if (this.options.englishDetection &&
      (!isViablePrefix(this.letters) || !toneFits(this.letters, this.tone)) && !this.macroPrefix()) {
      return this.toLiteral(this.plain);
    }
    return new EngineResult(this.getComposition());
  }
  private toLiteral(text: string): EngineResult {
    this.reset(); this.literal = true;
    return new EngineResult('', text);
  }
}
