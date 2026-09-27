import { InputMode } from '../engine/VietnameseInputEngine';

// Per-app Ví / EN, framework independent. Rules are "bundle=VI" / "bundle=EN" entries.
export const MAX_APP_RULES: number = 200;
export const MAX_RECENT_APPS: number = 30;

// "bundle=VI|EN" -> [bundle, mode]; otherwise [] (invalid).
export function parseAppRule(entry: string): string[] {
  const at = entry.lastIndexOf('=');
  if (at <= 0) { return []; }
  const bundle = entry.slice(0, at).trim();
  const mode = entry.slice(at + 1).trim().toUpperCase();
  if (!/^[A-Za-z0-9_.\-]{1,128}$/.test(bundle) || (mode !== 'VI' && mode !== 'EN')) { return []; }
  return [bundle, mode];
}

// Known display names; other apps show their bundle ID (no permission to read app labels).
const APP_NAMES: Record<string, string> = {
  'com.huawei.hmos.browser': 'Trình duyệt Huawei',
  'com.huawei.hmos.email': 'Email',
  'com.huawei.hmos.notepad': 'Ghi chú',
  'com.huawei.hmos.hinotepad': 'Ghi chú',
  'com.huawei.hmos.hinote': 'Ghi chú',
  'com.huawei.hmos.hiwrite': 'Huawei Writer',
  'com.huawei.hmos.vassistant': 'Trợ lý Celia',
  'com.huawei.hmos.hishell': 'Terminal (HiShell)',
  'com.huawei.shell_assistant': 'Shell Assistant',
  'app.hackeris.hish': 'Hish Terminal',
  'com.termnext.hos': 'TermNext',
  'cn.wps.office.hap': 'WPS Office',
  'app.fuqidian.pureoffice': 'Pure Office',
  'com.easy.hmos.abroad': 'Ứng dụng Android (EasyAbroad)',
  'com.tencent.wechat.pc': 'WeChat',
  'com.oseasy1.ohvm': 'Máy ảo OSEasy',
  'com.vietime.inputmethod': 'VietIME',
};
export function appDisplayName(bundle: string): string { return APP_NAMES[bundle] ?? bundle; }

// Built-in rules by app type, below the user's own rules: terminals are EN; office, browsers,
// AI assistants and EasyAbroad (Android apps) are Ví. Exact bundle IDs seen on HarmonyOS PC
// first, then words in the bundle ID for other apps (com.example.sshclient -> terminal).
export const PRESET_LABELS: Record<string, string> = {
  'terminal': 'Terminal', 'office': 'Văn phòng', 'browser': 'Trình duyệt', 'ai': 'AI', 'android': 'EasyAbroad',
};
const PRESET_BUNDLES: Record<string, string> = {
  'com.huawei.hmos.hishell': 'terminal', 'com.huawei.shell_assistant': 'terminal', 'app.hackeris.hish': 'terminal',
  'com.termnext.hos': 'terminal',
  'cn.wps.office.hap': 'office', 'app.fuqidian.pureoffice': 'office', 'com.huawei.hmos.hiwrite': 'office',
  'com.huawei.hmos.notepad': 'office', 'com.huawei.hmos.hinotepad': 'office', 'com.huawei.hmos.hinote': 'office',
  'com.huawei.hmos.email': 'office',
  'com.huawei.hmos.browser': 'browser',
  'com.huawei.hmos.vassistant': 'ai', 'com.huawei.hmsapp.hiai': 'ai',
  'com.easy.hmos.abroad': 'android',
};
class PresetWords {
  constructor(public category: string, public exact: string[], public contains: string[]) {}
}
// Matched against each part of the bundle ID (split at . _ -), in this order.
const PRESET_WORDS: PresetWords[] = [
  new PresetWords('terminal', ['term', 'hish', 'putty', 'tmux', 'console', 'termius', 'tabby', 'warp'],
    ['terminal', 'termux', 'shell', 'ssh']),
  new PresetWords('ai', ['ai', 'chatgpt', 'openai', 'gpt', 'claude', 'anthropic', 'gemini', 'bard', 'copilot', 'deepseek',
    'doubao', 'kimi', 'moonshot', 'qwen', 'tongyi', 'yuanbao', 'ernie', 'yiyan', 'wenxin', 'chatglm', 'zhipu',
    'hunyuan', 'minimax', 'perplexity', 'grok', 'mistral', 'poe', 'xiaoyi', 'celia', 'vassistant'], ['chatgpt', 'deepseek']),
  new PresetWords('browser', ['chrome', 'chromium', 'firefox', 'mozilla', 'edge', 'opera', 'brave', 'vivaldi', 'ucmobile', 'quark'],
    ['browser']),
  new PresetWords('office', ['wps', 'word', 'excel', 'powerpoint', 'onenote', 'outlook', 'docs', 'sheets', 'slides', 'notepad',
    'hinote', 'note', 'notes', 'notion', 'obsidian', 'pages', 'keynote', 'mail', 'email', 'writer', 'hiwrite'], ['office', 'pdf']),
];
// Category of an app for the built-in rules ('' when none applies).
export function presetCategory(bundle: string): string {
  const exact = PRESET_BUNDLES[bundle];
  if (exact !== undefined) { return exact; }
  const parts = bundle.toLowerCase().split(/[._\-]/);
  for (const words of PRESET_WORDS) {
    if (parts.some((part: string): boolean => words.exact.includes(part) ||
      words.contains.some((w: string): boolean => part.includes(w)))) { return words.category; }
  }
  return '';
}
export function presetMode(bundle: string): InputMode | undefined {
  const category = presetCategory(bundle);
  if (category.length === 0) { return undefined; }
  return category === 'terminal' ? InputMode.English : InputMode.Vietnamese;
}

// Apps with a rule always start in that mode; a toggle inside them lasts until the next app.
// Other apps share the mode the user last chose outside rule apps, or, with `remember`, the
// mode last used in that very app.
export class AppModePolicy {
  private enabled: boolean = false;
  private remember: boolean = false;
  private presets: boolean = true;
  private rules: Map<string, InputMode> = new Map<string, InputMode>();
  private remembered: Map<string, InputMode> = new Map<string, InputMode>();
  private current: string = '';
  private currentRuled: boolean = false;
  private globalMode: InputMode | undefined = undefined;

  configure(enabled: boolean, remember: boolean, rules: string[], presets: boolean = true): void {
    this.enabled = enabled; this.remember = remember; this.presets = presets; this.rules.clear();
    for (const entry of rules) {
      const rule = parseAppRule(entry);
      if (rule.length === 2) { this.rules.set(rule[0], rule[1] === 'EN' ? InputMode.English : InputMode.Vietnamese); }
    }
  }
  isEnabled(): boolean { return this.enabled; }
  setRemembered(entries: Record<string, string>): void {
    this.remembered.clear();
    for (const bundle of Object.keys(entries)) {
      const mode = entries[bundle];
      if (mode === 'EN' || mode === 'VI') { this.remembered.set(bundle, mode === 'EN' ? InputMode.English : InputMode.Vietnamese); }
    }
  }
  getRemembered(): Record<string, string> {
    const out: Record<string, string> = {};
    this.remembered.forEach((mode: InputMode, bundle: string): void => { out[bundle] = mode === InputMode.English ? 'EN' : 'VI'; });
    return out;
  }
  // Focus moved to an editor of `bundle`. Returns the mode to switch to, or undefined to keep.
  // Focus changes inside the same app never switch, so a manual toggle there is respected.
  enter(bundle: string, mode: InputMode, force: boolean = false): InputMode | undefined {
    if (!this.enabled || bundle.length === 0) { return undefined; }
    if (bundle === this.current && !force) { return undefined; }
    if (!this.currentRuled || this.globalMode === undefined) { this.globalMode = mode; }
    this.current = bundle;
    const rule = this.rules.get(bundle) ?? (this.presets ? presetMode(bundle) : undefined);
    this.currentRuled = rule !== undefined;
    const target = rule ?? (this.remember ? this.remembered.get(bundle) : undefined) ?? this.globalMode;
    return target !== mode ? target : undefined;
  }
  // The user switched mode (shortcut, tray, badge). Returns true when remembered modes changed.
  toggled(mode: InputMode): boolean {
    if (!this.enabled || this.current.length === 0 || this.currentRuled) { return false; }
    this.globalMode = mode;
    if (!this.remember || this.remembered.get(this.current) === mode) { return false; }
    this.remembered.set(this.current, mode);
    // Bounded: drop the oldest entry (Map keeps insertion order).
    if (this.remembered.size > MAX_RECENT_APPS * 4) { this.remembered.delete(this.remembered.keys().next().value as string); }
    return true;
  }
  // Next enter() re-evaluates even for the same app (settings changed).
  invalidate(): void { this.current = ''; }
}

// Most recent first, unique, bounded.
export function pushRecent(list: string[], bundle: string): string[] {
  if (list.length > 0 && list[0] === bundle) { return list; }
  return [bundle].concat(list.filter((b: string): boolean => b !== bundle)).slice(0, MAX_RECENT_APPS);
}
