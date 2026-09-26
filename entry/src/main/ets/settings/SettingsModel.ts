import { DEFAULT_ENGLISH_WORDS, EngineOptions } from '../engine/VietnameseInputEngine';

export class SettingsModel {
  enabled: boolean = true;
  startVietnamese: boolean = true;
  shortcut: string = 'Shift';
  virtualKeyboard: boolean = false;
  autoShow: boolean = false;
  modernTone: boolean = true;
  freeTyping: boolean = true;
  restoreInvalid: boolean = true;
  passwordVietnamese: boolean = false;
  autoUrl: boolean = true;
  autoEmail: boolean = true;
  // Editors without pre-edit (Android apps via EasyAbroad) get direct delete/insert typing.
  directFallback: boolean = true;
  englishDetection: boolean = true;
  // Small floating Ví / EN badge (STATUS_BAR panel) while an editor is attached.
  floatingIndicator: boolean = true;
  // UniKey feel: type straight into every editor (delete/insert, no underlined pre-edit).
  uniKeyStyle: boolean = true;
  // Repeated tone key behaves like UniKey (ass -> as) instead of keeping raw keys.
  uniKeyUndo: boolean = false;
  // Full list of words kept as typed (built-ins included, so users can edit or delete them).
  englishList: string[] = DEFAULT_ENGLISH_WORDS.slice();
  theme: string = 'System';
  keyboardHeight: number = 280;
  keyLabelSize: number = 20;
  // Explicit app list: public editor attributes do not identify an app's category.
  excludedBundles: string = '';
  engineOptions(): EngineOptions {
    const options = new EngineOptions();
    options.modernTone = this.modernTone; options.freeTyping = this.freeTyping;
    options.restoreInvalid = this.restoreInvalid; options.autoUrl = this.autoUrl; options.autoEmail = this.autoEmail;
    options.englishDetection = this.englishDetection; options.uniKeyUndo = this.uniKeyUndo;
    options.englishWords = this.englishList.map((w: string): string => w.toLowerCase());
    return options;
  }
}
