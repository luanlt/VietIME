import { DEFAULT_ENGLISH_WORDS, EngineOptions, ENGLISH_WORDS_VERSION } from '../engine/VietnameseInputEngine';

export class SettingsModel {
  enabled: boolean = true;
  startVietnamese: boolean = true;
  shortcut: string = 'Alt+Z';
  // Version 2 (1.0.7) moved the default from a Shift tap to Alt+Z; older saved values migrate once.
  shortcutVersion: number = 2;
  virtualKeyboard: boolean = false;
  autoShow: boolean = false;
  modernTone: boolean = true;
  freeTyping: boolean = true;
  zRemovesTone: boolean = true;
  restoreInvalid: boolean = true;
  passwordVietnamese: boolean = false;
  autoUrl: boolean = true;
  autoEmail: boolean = true;
  // Editors without pre-edit (Android apps via EasyAbroad) get direct delete/insert typing.
  directFallback: boolean = true;
  englishDetection: boolean = true;
  // Small floating Ví / EN badge (STATUS_BAR panel) while an editor is attached. Off by default
  // since 1.0.6 (new key, so the old default-on floatingIndicator is not carried over).
  floatingBadge: boolean = false;
  // UniKey feel: type straight into every editor (delete/insert, no underlined pre-edit).
  uniKeyStyle: boolean = true;
  // A double press always undoes the tone (oss -> os); on: a tone key repeated later in the word too (tests -> tets).
  uniKeyUndo: boolean = false;
  // Full list of words kept as typed (built-ins included, so users can edit or delete them).
  englishList: string[] = DEFAULT_ENGLISH_WORDS.slice();
  // Built-in words added in later versions are merged once into a saved list.
  englishListVersion: number = ENGLISH_WORDS_VERSION;
  // Advanced: capital letter after . ! ? and a space/Enter; optionally at the start of an empty field.
  autoCapitalize: boolean = true;
  capitalizeFieldStart: boolean = false;
  // Digits and symbols are typed by the editor (system layout), not from the key event's unicodeChar.
  nativeSymbols: boolean = true;
  // Abbreviations: entries "key=expansion", key letters only (vn=Việt Nam).
  macroEnabled: boolean = true;
  macros: string[] = [];
  theme: string = 'System';
  keyboardHeight: number = 280;
  keyLabelSize: number = 20;
  // Explicit app list: public editor attributes do not identify an app's category.
  excludedBundles: string = '';
  // Per-app Ví / EN: rules "bundle=VI|EN"; optionally remember the last mode used in other apps.
  perAppEnabled: boolean = true;
  perAppRemember: boolean = false;
  // Built-in rules by app type (terminal EN; office, browser, AI, EasyAbroad Ví) under appRules.
  perAppPresets: boolean = true;
  appRules: string[] = [];
  engineOptions(): EngineOptions {
    const options = new EngineOptions();
    options.modernTone = this.modernTone; options.freeTyping = this.freeTyping; options.zRemovesTone = this.zRemovesTone;
    options.restoreInvalid = this.restoreInvalid; options.autoUrl = this.autoUrl; options.autoEmail = this.autoEmail;
    options.englishDetection = this.englishDetection; options.uniKeyUndo = this.uniKeyUndo;
    options.englishWords = this.englishList.map((w: string): string => w.toLowerCase());
    if (this.macroEnabled) {
      for (const entry of this.macros) {
        const macro = parseMacro(entry);
        if (macro.length === 2) { options.macros.set(macro[0], macro[1]); }
      }
    }
    return options;
  }
}

// "key=expansion" -> [key, expansion]; key is lower-cased letters, otherwise [] (invalid).
export function parseMacro(entry: string): string[] {
  const at = entry.indexOf('=');
  if (at <= 0) { return []; }
  const key = entry.slice(0, at).trim().toLowerCase();
  const value = entry.slice(at + 1).trim();
  if (!/^[a-z]{1,16}$/.test(key) || value.length === 0 || value.length > 200) { return []; }
  return [key, value];
}
