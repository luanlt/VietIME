import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';
import { MAX_RECENT_APPS } from '../ime/AppModePolicy';

// Per-app data written by the IME process, separate from the settings snapshot the UI owns:
// bundle IDs of recently used apps (for picking in Settings) and remembered Ví / EN modes.
// Only kept while "Tự chuyển Việt/Anh theo ứng dụng" is on; never any typed text.
const NAME: string = 'vietime_apps_v1';

export class AppHistory {
  private context: common.Context;
  private store: preferences.Preferences;

  constructor(context: common.Context) {
    this.context = context.getApplicationContext();
    this.store = preferences.getPreferencesSync(this.context, { name: NAME });
  }
  // The other process may have written: drop the cached copy first.
  private reload(): void {
    try {
      preferences.removePreferencesFromCacheSync(this.context, NAME);
      this.store = preferences.getPreferencesSync(this.context, { name: NAME });
    } catch (error) { throw error as Error; }
  }
  recent(): string[] {
    try {
      this.reload();
      const list = JSON.parse(this.store.getSync('recent', '[]') as string) as string[];
      return Array.isArray(list) ? list.filter((b: string): boolean => typeof b === 'string').slice(0, MAX_RECENT_APPS) : [];
    } catch (error) { return []; }
  }
  modes(): Record<string, string> {
    try {
      this.reload();
      const value = JSON.parse(this.store.getSync('modes', '{}') as string) as Record<string, string>;
      return value && typeof value === 'object' ? value : {};
    } catch (error) { return {}; }
  }
  async save(recent: string[], modes: Record<string, string>): Promise<void> {
    try {
      this.store.putSync('recent', JSON.stringify(recent));
      this.store.putSync('modes', JSON.stringify(modes));
      await this.store.flush();
    } catch (error) { throw error as Error; }
  }
  async clear(): Promise<void> {
    try { this.reload(); } catch (error) { throw error as Error; }
    await this.save([], {});
  }
}
