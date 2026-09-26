import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';
import { parseMacro, SettingsModel } from './SettingsModel';
import { DEFAULT_ENGLISH_WORDS } from '../engine/VietnameseInputEngine';

const NAME: string = 'vietime_settings_v1';

export class SettingsRepository {
  private static instance: SettingsRepository | undefined = undefined;
  private store: preferences.Preferences;
  private context: common.Context;
  private callback: () => void = (): void => {};
  private watching: boolean = false;
  private onChange = (key: string): void => { if (key === 'settings') { this.callback(); } };

  static get(context: common.Context): SettingsRepository {
    // Share within this process only. Cross-process refresh uses Preferences events.
    if (!SettingsRepository.instance) { SettingsRepository.instance = new SettingsRepository(context.getApplicationContext()); }
    return SettingsRepository.instance;
  }
  private constructor(context: common.Context) {
    this.context = context;
    this.store = preferences.getPreferencesSync(context, { name: NAME });
  }
  watch(callback: () => void): void {
    this.callback = callback;
    if (this.watching) { return; }
    // multiProcessChange throws 15500000 on some devices (HarmonyOS PC 6.1.0); settings are
    // still reloaded on every inputStart, so it is best effort.
    try { this.store.on('multiProcessChange', this.onChange); } catch (error) { /* best effort */ }
    try { this.store.on('change', this.onChange); this.watching = true; } catch (error) { throw error as Error; }
  }
  close(): void {
    if (!this.watching) { return; }
    try { this.store.off('multiProcessChange', this.onChange); } catch (error) { /* never subscribed */ }
    try { this.store.off('change', this.onChange); this.watching = false; } catch (error) { throw error as Error; }
  }
  load(): SettingsModel {
    try {
      const wasWatching = this.watching; this.close();
      preferences.removePreferencesFromCacheSync(this.context, NAME);
      this.store = preferences.getPreferencesSync(this.context, { name: NAME });
      if (wasWatching) { this.watch(this.callback); }
      const raw = this.store.getSync('settings', '{}') as string;
      const values = JSON.parse(raw) as Record<string, preferences.ValueType>;
      const config = new SettingsModel();
      config.enabled = this.bool(values, 'enabled', true);
      config.startVietnamese = this.bool(values, 'startVietnamese', true);
      // Ctrl+Shift is reserved by HarmonyOS PC for switching input methods and never reaches
      // the IME, so saved Ctrl+Shift (the old default) migrates to a Shift tap.
      const shortcut = this.str(values, 'shortcut', 'Shift');
      config.shortcut = ['Shift', 'Alt+Z', 'Ctrl+Space'].includes(shortcut) ? shortcut : 'Shift';
      config.virtualKeyboard = this.bool(values, 'virtualKeyboard', false);
      config.autoShow = this.bool(values, 'autoShow', false);
      config.modernTone = this.bool(values, 'modernTone', true);
      config.freeTyping = this.bool(values, 'freeTyping', true);
      config.restoreInvalid = this.bool(values, 'restoreInvalid', true);
      config.passwordVietnamese = this.bool(values, 'passwordVietnamese', false);
      config.autoUrl = this.bool(values, 'autoUrl', true);
      config.autoEmail = this.bool(values, 'autoEmail', true);
      config.directFallback = this.bool(values, 'directFallback', true);
      config.englishDetection = this.bool(values, 'englishDetection', true);
      config.floatingIndicator = this.bool(values, 'floatingIndicator', true);
      config.uniKeyStyle = this.bool(values, 'uniKeyStyle', true);
      config.uniKeyUndo = this.bool(values, 'uniKeyUndo', false);
      config.englishList = this.englishList(values);
      config.autoCapitalize = this.bool(values, 'autoCapitalize', true);
      config.capitalizeFieldStart = this.bool(values, 'capitalizeFieldStart', false);
      config.nativeSymbols = this.bool(values, 'nativeSymbols', true);
      config.macroEnabled = this.bool(values, 'macroEnabled', true);
      const macros = values['macros'];
      config.macros = Array.isArray(macros) ? (macros as string[]).filter((m: string): boolean =>
        typeof m === 'string' && parseMacro(m).length === 2).slice(0, 500) : [];
      const theme = this.str(values, 'theme', 'System');
      config.theme = ['System','Light','Dark'].includes(theme) ? theme : 'System';
      config.keyboardHeight = this.num(values, 'keyboardHeight', 280, 180, 420);
      config.keyLabelSize = this.num(values, 'keyLabelSize', 20, 14, 32);
      config.excludedBundles = this.str(values, 'excludedBundles', '').slice(0, 2048);
      return config;
    } catch (error) { throw error as Error; }
  }
  // englishList (array) replaces the old comma-separated englishWords extras, which are migrated.
  private englishList(values: Record<string, preferences.ValueType>): string[] {
    const stored = values['englishList'];
    if (Array.isArray(stored)) {
      return (stored as string[]).filter((w: string): boolean => typeof w === 'string' && w.length > 0 && w.length <= 64).slice(0, 500);
    }
    const extra = this.str(values, 'englishWords', '').split(',').map((w: string): string => w.trim().toLowerCase())
      .filter((w: string): boolean => w.length > 0 && !DEFAULT_ENGLISH_WORDS.includes(w));
    return DEFAULT_ENGLISH_WORDS.concat(extra);
  }
  private bool(values: Record<string, preferences.ValueType>, key: string, fallback: boolean): boolean {
    return typeof values[key] === 'boolean' ? values[key] as boolean : fallback;
  }
  private str(values: Record<string, preferences.ValueType>, key: string, fallback: string): string {
    return typeof values[key] === 'string' ? values[key] as string : fallback;
  }
  private num(values: Record<string, preferences.ValueType>, key: string, fallback: number, min: number, max: number): number {
    const value = values[key];
    return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  }
  async save(config: SettingsModel): Promise<void> {
    try {
      // A single value gives observers an entire snapshot, never half of a form.
      this.store.putSync('settings', JSON.stringify(config)); await this.store.flush();
    } catch (error) { throw error as Error; }
  }
}

