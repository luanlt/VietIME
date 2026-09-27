// The tables describe spelling structure, not a dictionary or semantic spell checker.
const VOWELS: string = 'aăâeêioôơuưy';
const ONSETS: string[] = ['', 'b', 'c', 'ch', 'd', 'đ', 'g', 'gh', 'gi', 'h', 'k', 'kh', 'l', 'm', 'n', 'ng', 'ngh', 'nh', 'p', 'ph', 'qu', 'r', 's', 't', 'th', 'tr', 'v', 'x'];
const CODAS: string[] = ['', 'c', 'ch', 'm', 'n', 'ng', 'nh', 'p', 't'];
const NUCLEI: string[] = ['a','ă','â','e','ê','i','o','ô','ơ','u','ư','y','ai','ao','au','ay','âu','ây','eo','êu','ia','iê','iu','oa','oă','oe','oi','ôi','ơi','oo','ua','uă','uâ','uê','ui','uo','uô','uơ','uy','ưa','ưi','ưu','ươ','yê','iêu','oai','oao','oay','oeo','uai','uây','uôi','uơi','uya','uyê','uyu','ươi','ươu','yêu'];

export class Syllable {
  onset: string = '';
  nucleus: string = '';
  coda: string = '';
  start: number = -1;
  end: number = -1;
  valid: boolean = false;
}

export function isVowel(char: string): boolean { return VOWELS.includes(char.toLowerCase()); }

export function parseSyllable(letters: string[]): Syllable {
  const result = new Syllable();
  const word = letters.join('').toLowerCase();
  let start = 0;
  while (start < word.length && !isVowel(word.charAt(start))) { start++; }
  // u in qu and i in gi are excluded only when followed by a vowel.
  if (word.startsWith('qu') && word.length > 2 && isVowel(word.charAt(2))) { start = 2; }
  if (word.startsWith('gi') && word.length > 2 && isVowel(word.charAt(2))) { start = 2; }
  if (start === word.length) { return result; }
  let end = start;
  while (end < word.length && isVowel(word.charAt(end))) { end++; }
  result.onset = word.slice(0, start);
  result.nucleus = word.slice(start, end);
  result.coda = word.slice(end);
  result.start = start;
  result.end = end;
  result.valid = ONSETS.includes(result.onset) && CODAS.includes(result.coda) && NUCLEI.includes(result.nucleus);
  return result;
}

export function toneIndex(letters: string[], modern: boolean): number {
  const syllable = parseSyllable(letters);
  if (syllable.start < 0) { return -1; }
  const nucleus = syllable.nucleus;
  // ươ carries tone on ơ; all remaining shaped vowels take priority.
  const hornO = nucleus.indexOf('ơ');
  if (hornO >= 0) { return syllable.start + hornO; }
  for (let i = nucleus.length - 1; i >= 0; i--) {
    if ('ăâêôư'.includes(nucleus.charAt(i))) { return syllable.start + i; }
  }
  if (nucleus.length === 1) { return syllable.start; }
  if (nucleus.length >= 3) { return syllable.start + 1; }
  // Product default follows the requested examples hóa / thúy.
  if (!modern && ['oa', 'oe', 'uy'].includes(nucleus) && syllable.coda === '') { return syllable.end - 1; }
  return syllable.coda.length > 0 ? syllable.end - 1 : syllable.start;
}

export function withCase(original: string, replacement: string): string {
  return original === original.toUpperCase() ? replacement.toUpperCase() : replacement;
}

const TONE_ROWS: string[] = ['aáàảãạ','ăắằẳẵặ','âấầẩẫậ','eéèẻẽẹ','êếềểễệ','iíìỉĩị','oóòỏõọ','ôốồổỗộ','ơớờởỡợ','uúùủũụ','ưứừửữự','yýỳỷỹỵ'];
export function toneChar(char: string, tone: number): string {
  const index = VOWELS.indexOf(char.toLowerCase());
  return index < 0 ? char : withCase(char, TONE_ROWS[index].charAt(tone));
}

export function stripTone(char: string): string {
  const lower = char.toLowerCase();
  for (let i = 0; i < TONE_ROWS.length; i++) {
    if (TONE_ROWS[i].includes(lower)) { return withCase(char, VOWELS.charAt(i)); }
  }
  return char;
}

const MODIFIED: string = 'ăâêôơư';
const BASE_OF: string = 'aaeoou';
function sameOrBase(typed: string, target: string): boolean {
  if (typed === target) { return true; }
  const index = MODIFIED.indexOf(target);
  return index >= 0 && BASE_OF.charAt(index) === typed;
}
// Whether `typed` can still become `target` through Telex modifiers (e.g. "uo" -> "ươ").
function compatible(typed: string, target: string, whole: boolean): boolean {
  if (typed.length > target.length || (whole && typed.length !== target.length)) { return false; }
  for (let i = 0; i < typed.length; i++) { if (!sameOrBase(typed.charAt(i), target.charAt(i))) { return false; } }
  return true;
}
function viableFrom(onset: string, rest: string): boolean {
  let end = 0;
  while (end < rest.length && isVowel(rest.charAt(end))) { end++; }
  if (end === 0) { return rest.length === 0 && ONSETS.some((o: string): boolean => o.startsWith(onset)); }
  if (!ONSETS.includes(onset)) { return false; }
  const nucleus = rest.slice(0, end);
  const coda = rest.slice(end);
  if (coda.length === 0) { return NUCLEI.some((n: string): boolean => compatible(nucleus, n, false)); }
  // A consonant after the vowels closes the nucleus; nothing may follow a coda but coda letters.
  return NUCLEI.some((n: string): boolean => compatible(nucleus, n, true)) &&
    CODAS.some((c: string): boolean => c.length > 0 && c.startsWith(coda));
}
// Structural test: can these letters still grow into a Vietnamese syllable?
// Used to switch a token to literal (English) while typing, not a dictionary.
export function isViablePrefix(letters: string[]): boolean {
  const word = letters.join('').toLowerCase();
  if (word.length === 0) { return true; }
  let start = 0;
  while (start < word.length && !isVowel(word.charAt(start))) { start++; }
  const onset = word.slice(0, start);
  if (start === word.length) { return viableFrom(onset, ''); }
  // qu / gi: the u or i may belong to the onset.
  if (onset === 'q') { return word.charAt(1) === 'u' && (word.length === 2 || viableFrom('qu', word.slice(2))); }
  if (onset === 'g' && word.charAt(1) === 'i' && word.length > 2 && viableFrom('gi', word.slice(2))) { return true; }
  return viableFrom(onset, word.slice(start));
}

// A syllable closed by c, ch, p or t only takes sắc or nặng (tone 1 or 5), so tốt/học but never
// tẽt: pỏt, texts -> tẽt/tét are English (port, texts).
export function toneFits(letters: string[], tone: number): boolean {
  if (tone === 0 || tone === 1 || tone === 5) { return true; }
  const syllable = parseSyllable(letters);
  if (syllable.start < 0) { return true; }
  const coda = letters.slice(syllable.end).join('').toLowerCase();
  return !['c', 'ch', 'p', 't'].includes(coda);
}
