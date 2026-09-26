import { inputMethod, inputMethodEngine, InputMethodExtensionContext, InputMethodSubtype } from '@kit.IMEKit';
import * as keyEvent from '@ohos.multimodalInput.keyEvent';
import { KeyCode } from '@ohos.multimodalInput.keyCode';
import { display } from '@kit.ArkUI';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import BuildProfile from 'BuildProfile';
import { SettingsRepository } from '../settings/SettingsRepository';
import { SettingsModel } from '../settings/SettingsModel';
import { InputMode } from '../engine/VietnameseInputEngine';
import { CompositionSession } from './CompositionSession';
import { HarmonyEditor } from './HarmonyEditor';
import { ShiftTapTracker, ShortcutTracker } from './ShortcutTracker';
import { ImeStatus, SettingsSignal, StatusBridge } from '../utils/StatusBridge';

// Subtype ids from input_method_config.json; the system shows the current one (Ví / EN).
const SUBTYPE_VI: string = 'vi_telex';
const SUBTYPE_EN: string = 'en';
const MODIFIER_KEYS: number[] = [KeyCode.KEYCODE_CTRL_LEFT, KeyCode.KEYCODE_CTRL_RIGHT, KeyCode.KEYCODE_SHIFT_LEFT, KeyCode.KEYCODE_SHIFT_RIGHT];

export class ImeRuntime {
  private ability: inputMethodEngine.InputMethodAbility = inputMethodEngine.getInputMethodAbility();
  private delegate: inputMethodEngine.KeyboardDelegate = inputMethodEngine.getKeyboardDelegate();
  private session: CompositionSession = new CompositionSession();
  private chord: ShortcutTracker = new ShortcutTracker();
  private shiftTap: ShiftTapTracker = new ShiftTapTracker();
  private settingsSignal: SettingsSignal = new SettingsSignal();
  // Alt held state tracked from key events; some editors deliver the Z event without altKey.
  private altHeld: boolean = false;
  private lastToggle: number = 0;
  private consumed: Set<number> = new Set<number>();
  private config: SettingsModel = new SettingsModel();
  private repository: SettingsRepository | undefined = undefined;
  private client: inputMethodEngine.InputClient | undefined = undefined;
  private attribute: inputMethodEngine.EditorAttribute | undefined = undefined;
  private panel: inputMethodEngine.Panel | undefined = undefined;
  // Floating Ví / EN badge; independent of the soft keyboard panel.
  private statusPanel: inputMethodEngine.Panel | undefined = undefined;
  private indicatorTimer: number = -1;
  private alive: boolean = false;
  private panelQueue: Promise<void> = Promise.resolve();
  private wantPanel: boolean = false;
  private hiddenForSession: boolean = false;
  private settingsTimer: number = -1;
  private sensitive: boolean = true;
  private statusBridge: StatusBridge = new StatusBridge();

  private onStart = (controller: inputMethodEngine.KeyboardController, client: inputMethodEngine.InputClient): void => {
    this.session.detach(); this.client = client; this.consumed.clear(); this.chord.reset(); this.shiftTap.reset(); this.altHeld = false;
    this.hiddenForSession = false;
    try {
      this.config = this.repository?.load() ?? this.config;
      this.attribute = client.getEditorAttributeSync();
      this.session.attach(new HarmonyEditor(client), this.preEdit(this.attribute), this.shouldBypass());
      this.session.configure(this.config.engineOptions()); this.session.setDirectFallback(this.config.directFallback || this.config.uniKeyStyle);
      this.logEditor('start');
      this.publishState();
    } catch (error) { this.session.detach(); this.fail(error as BusinessError); }
    this.syncPanel(); this.syncIndicator();
  };
  private onStop = (): void => {
    this.session.detach(); this.client = undefined; this.attribute = undefined; this.sensitive = true;
    this.consumed.clear(); this.chord.reset(); this.shiftTap.reset(); this.altHeld = false; this.wantPanel = false; this.syncPanel(); this.publishState();
    this.syncIndicator();
  };
  // User picked Ví / EN in the system input method indicator.
  private onSubtype = (subtype: InputMethodSubtype): void => {
    const mode = subtype.id === SUBTYPE_EN ? InputMode.English : InputMode.Vietnamese;
    this.log(`setSubtype ${subtype.id} (mode now ${this.session.getMode()})`);
    if (subtype.id !== SUBTYPE_EN && subtype.id !== SUBTYPE_VI) { return; }
    if (mode === this.session.getMode()) { return; }
    try { this.session.setMode(mode); } catch (error) { this.fail(error as BusinessError); }
    this.publishState();
  };
  private onShow = (): void => { this.wantPanel = true; this.syncPanel(); };
  private onHide = (): void => { this.wantPanel = false; this.syncPanel(); };
  private onSelection = (oldStart: number, oldEnd: number, start: number, end: number): void => {
    try { this.session.selectionChanged(start, end); } catch (error) { this.fail(error as BusinessError); }
  };
  private onAttribute = (attribute: inputMethodEngine.EditorAttribute): void => {
    // Commit only to the currently owned client; do not inspect password content.
    this.attribute = attribute;
    try { this.session.setPolicy(this.preEdit(attribute), this.shouldBypass()); } catch (error) { this.fail(error as BusinessError); }
    this.logEditor('attribute');
    this.publishState();
  };
  private onKey = (event: keyEvent.KeyEvent): boolean => {
    if (!this.client || !this.panel) { return false; }
    const code: number = event.key.code;
    const modifier = MODIFIER_KEYS.includes(code);
    if (event.action === keyEvent.Action.CANCEL) { this.chord.reset(); this.consumed.clear(); return false; }
    const down = event.action === keyEvent.Action.DOWN;
    try {
      // Modifier keys only (never text keys): shows whether Ctrl/Shift reach the IME at all.
      if (modifier) { this.log(`modifier ${code} ${down ? 'down' : 'up'} ctrl=${event.ctrlKey} shift=${event.shiftKey}`); }
      const isShift = code === KeyCode.KEYCODE_SHIFT_LEFT || code === KeyCode.KEYCODE_SHIFT_RIGHT;
      if (code === KeyCode.KEYCODE_ALT_LEFT || code === KeyCode.KEYCODE_ALT_RIGHT) { this.altHeld = down; }
      const alt = event.altKey || this.altHeld;
      if (this.config.shortcut === 'Shift' && this.shiftTap.update(down, isShift, event.ctrlKey, event.altKey, event.logoKey)) {
        this.toggleMode();
      }
      if (this.config.shortcut === 'Ctrl+Shift' && this.chord.update(down, modifier, event.ctrlKey, event.shiftKey, event.altKey, event.logoKey)) {
        this.toggleMode();
      }
      if (!down) { const handled = this.consumed.has(code); this.consumed.delete(code); return handled; }
      const hotkey = !event.logoKey && (
        (this.config.shortcut === 'Alt+Z' && alt && !event.ctrlKey && !event.shiftKey && code === KeyCode.KEYCODE_Z) ||
        (this.config.shortcut === 'Ctrl+Space' && event.ctrlKey && !event.altKey && !event.shiftKey && code === KeyCode.KEYCODE_SPACE));
      if (hotkey) {
        if (!this.consumed.has(code)) { this.toggleMode(); }
        this.consumed.add(code); return true;
      }
      if (modifier) { return false; }
      if (event.ctrlKey || event.altKey || event.logoKey || event.fnKey) { this.session.commit(); return false; }
      if (code === KeyCode.KEYCODE_ENTER || code === KeyCode.KEYCODE_DPAD_LEFT || code === KeyCode.KEYCODE_DPAD_RIGHT ||
        code === KeyCode.KEYCODE_DPAD_UP || code === KeyCode.KEYCODE_DPAD_DOWN || code === KeyCode.KEYCODE_FORWARD_DEL ||
        code === KeyCode.KEYCODE_MOVE_HOME || code === KeyCode.KEYCODE_MOVE_END || code === KeyCode.KEYCODE_TAB) {
        this.session.commit(); return false;
      }
      let text = '';
      if (code === KeyCode.KEYCODE_DEL) { text = 'Backspace'; }
      else if (code === KeyCode.KEYCODE_ESCAPE) { text = 'Escape'; }
      else if (event.unicodeChar >= 32 && event.unicodeChar <= 0x10FFFF) { text = String.fromCodePoint(event.unicodeChar); }
      else { this.session.commit(); return false; }
      const handled = this.session.process(text);
      // No per-key UI/state publishing: keep the key path to engine + editor IPC only.
      if (handled) { this.consumed.add(code); }
      return handled;
    } catch (error) {
      this.fail(error as BusinessError); this.publishState();
      // IPC may have already written: consume this event, then bypass until a new session.
      this.consumed.add(code); return true;
    }
  };
  create(context: InputMethodExtensionContext): void {
    if (BuildProfile.DEBUG) { this.session.trace = (m: string): void => { hilog.info(0x0F1E, 'VietIME', 'probe %{public}s', m); }; }
    this.alive = true;
    this.statusBridge = new StatusBridge();
    this.statusBridge.serve((): ImeStatus => {
      const status = new ImeStatus();
      status.state = AppStorage.get<string>('imeState') ?? 'Đang khởi động';
      status.mode = AppStorage.get<string>('imeMode') ?? 'Chưa rõ';
      status.client = AppStorage.get<string>('imeClient') ?? 'Chưa gắn ô nhập';
      status.panel = AppStorage.get<string>('imePanel') ?? 'Chưa rõ';
      status.timestamp = Date.now(); return status;
    });
    try {
      this.repository = SettingsRepository.get(context);
      this.config = this.repository.load();
      this.settingsSignal.listen((): void => {
        if (this.settingsTimer >= 0) { clearTimeout(this.settingsTimer); }
        this.settingsTimer = setTimeout((): void => { this.reloadSettings(); }, 50);
      });
      this.repository.watch((): void => {
        if (this.settingsTimer >= 0) { clearTimeout(this.settingsTimer); }
        this.settingsTimer = setTimeout((): void => { this.reloadSettings(); }, 50);
      });
    } catch (error) { this.fail(error as BusinessError); }
    this.session.setMode(this.config.startVietnamese ? InputMode.Vietnamese : InputMode.English);
    this.ability.on('inputStart', this.onStart); this.ability.on('inputStop', this.onStop);
    this.ability.on('keyboardShow', this.onShow); this.ability.on('keyboardHide', this.onHide);
    this.ability.on('setSubtype', this.onSubtype);
    this.syncSubtype();
    this.delegate.on('keyEvent', this.onKey); this.delegate.on('selectionChange', this.onSelection);
    this.delegate.on('editorAttributeChanged', this.onAttribute);
    // Create an IME panel even when hidden: several SDK editing methods require its existence.
    // Some 2in1 builds may reject a fixed panel; retry floating so physical typing is not lost.
    this.ability.createPanel(context, { type: inputMethodEngine.PanelType.SOFT_KEYBOARD, flag: inputMethodEngine.PanelFlag.FLG_FIXED })
      .catch((): Promise<inputMethodEngine.Panel> => this.ability.createPanel(context,
        { type: inputMethodEngine.PanelType.SOFT_KEYBOARD, flag: inputMethodEngine.PanelFlag.FLG_FLOATING }))
      .then(async (panel: inputMethodEngine.Panel): Promise<void> => {
        if (!this.alive) { await this.ability.destroyPanel(panel); return; }
        this.panel = panel;
        await panel.setUiContent('keyboard/SoftKeyboard');
        if (this.alive) { this.syncPanel(); }
      }).catch((error: BusinessError): void => { this.fail(error); });
    this.ability.createPanel(context, { type: inputMethodEngine.PanelType.STATUS_BAR })
      .then(async (panel: inputMethodEngine.Panel): Promise<void> => {
        if (!this.alive) { await this.ability.destroyPanel(panel); return; }
        this.statusPanel = panel;
        // Size the window before loading content: content laid out in a 0x0 window stayed
        // unpainted (black) on HarmonyOS PC 6.1. Bottom-left above the dock; draggable.
        const screen = display.getDefaultDisplaySync();
        const size = Math.round(40 * screen.densityPixels);
        await panel.resize(size, size);
        await panel.moveTo(Math.round(16 * screen.densityPixels), screen.height - Math.round(140 * screen.densityPixels));
        await panel.setUiContent('keyboard/StatusIndicator');
        // Force a fresh frame every time the window becomes visible.
        panel.on('show', (): void => { AppStorage.setOrCreate('indicatorFrame', Date.now()); this.log('indicator shown'); });
        if (this.alive) { this.syncIndicator(); }
      }).catch((error: BusinessError): void => { this.fail(error); });
    this.publishState();
  }
  // Shown while an editor is attached; hiding is delayed so focus changes do not flicker.
  private syncIndicator(): void {
    if (this.indicatorTimer >= 0) { clearTimeout(this.indicatorTimer); this.indicatorTimer = -1; }
    const panel = this.statusPanel;
    if (!panel) { return; }
    if (this.alive && this.config.floatingIndicator && !!this.client) {
      panel.show().catch((error: BusinessError): void => { this.fail(error); });
      return;
    }
    this.indicatorTimer = setTimeout((): void => {
      this.indicatorTimer = -1;
      panel.hide().catch((error: BusinessError): void => { this.fail(error); });
    }, this.alive ? 400 : 0);
  }
  startMovingIndicator(): void {
    try { this.statusPanel?.startMoving(); } catch (error) { this.fail(error as BusinessError); }
  }
  destroy(): void {
    this.alive = false;
    this.statusBridge.close(); this.settingsSignal.close();
    if (this.settingsTimer >= 0) { clearTimeout(this.settingsTimer); }
    this.ability.off('inputStart', this.onStart); this.ability.off('inputStop', this.onStop);
    this.ability.off('keyboardShow', this.onShow); this.ability.off('keyboardHide', this.onHide);
    this.ability.off('setSubtype', this.onSubtype);
    this.delegate.off('keyEvent', this.onKey); this.delegate.off('selectionChange', this.onSelection);
    this.delegate.off('editorAttributeChanged', this.onAttribute);
    this.repository?.close(); this.onStop();
    if (this.indicatorTimer >= 0) { clearTimeout(this.indicatorTimer); this.indicatorTimer = -1; }
    const status = this.statusPanel; this.statusPanel = undefined;
    if (status) { this.ability.destroyPanel(status).catch((error: BusinessError): void => { this.fail(error); }); }
    const panel = this.panel; this.panel = undefined;
    if (panel) { this.panelQueue = this.panelQueue.then((): Promise<void> => this.ability.destroyPanel(panel)).catch((error: BusinessError): void => { this.fail(error); }); }
  }
  // UniKey style types directly everywhere; otherwise use pre-edit where the editor supports it.
  private preEdit(attr: inputMethodEngine.EditorAttribute): boolean {
    return attr.isTextPreviewSupported && !this.config.uniKeyStyle;
  }
  private shouldBypass(): boolean {
    const attr = this.attribute;
    if (!attr) { this.sensitive = true; return true; }
    this.sensitive = [inputMethod.TextInputType.VISIBLE_PASSWORD, inputMethod.TextInputType.NUMBER_PASSWORD,
      inputMethod.TextInputType.SCREEN_LOCK_PASSWORD, inputMethod.TextInputType.NEW_PASSWORD, inputMethod.TextInputType.ONE_TIME_CODE].includes(attr.inputPattern);
    const excluded = this.config.excludedBundles.split(',').map((s: string): string => s.trim()).filter((s: string): boolean => s.length > 0);
    return !this.config.enabled || (this.sensitive && !this.config.passwordVietnamese) ||
      (this.config.autoUrl && attr.inputPattern === inputMethod.TextInputType.URL) ||
      (this.config.autoEmail && attr.inputPattern === inputMethod.TextInputType.EMAIL_ADDRESS) ||
      excluded.includes(attr.bundleName ?? '');
  }
  private reloadSettings(): void {
    this.log(`settings reloaded`);
    this.settingsTimer = -1;
    if (!this.alive) { return; }
    try {
      this.session.commit(); this.config = this.repository?.load() ?? this.config;
      this.session.configure(this.config.engineOptions()); this.session.setDirectFallback(this.config.directFallback || this.config.uniKeyStyle);
      const attr = this.attribute;
      if (attr) { this.session.setPolicy(this.preEdit(attr), this.shouldBypass()); } else { this.session.setBypass(this.shouldBypass()); }
      this.syncPanel(); this.publishState(); this.syncIndicator();
    } catch (error) { this.fail(error as BusinessError); }
  }
  toggleMode(): void {
    // One physical press can surface twice (key repeat / duplicated events): debounce 300 ms.
    const now = Date.now();
    if (now - this.lastToggle < 300) { this.log('toggle ignored (debounce)'); return; }
    this.lastToggle = now;
    this.session.setMode(this.session.getMode() === InputMode.Vietnamese ? InputMode.English : InputMode.Vietnamese);
    this.log(`toggle -> ${this.session.getMode()}`);
    this.publishState(); this.syncSubtype();
  }
  // Keep the system indicator (Ví / EN) in step with shortcut toggles. Only the current IME
  // may switch its own subtype (API 11+); failures leave typing unaffected.
  private syncSubtype(): void {
    const wanted = this.session.getMode() === InputMode.English ? SUBTYPE_EN : SUBTYPE_VI;
    try {
      const current = inputMethod.getCurrentInputMethodSubtype();
      this.log(`subtype current=${current?.id} (${current?.name}) wanted=${wanted}`);
      if (current?.id === wanted) { return; }
    } catch (error) { this.log(`subtype current failed ${(error as BusinessError).code}`); }
    inputMethod.getSetting().listCurrentInputMethodSubtype()
      .then((list: InputMethodSubtype[]): Promise<boolean> | boolean => {
        const target = list.find((s: InputMethodSubtype): boolean => s.id === wanted);
        this.log(`subtype list=${list.map((s: InputMethodSubtype): string => s.id).join(',')} target=${target?.id}`);
        return target ? inputMethod.switchCurrentInputMethodSubtype(target) : false;
      })
      .then((ok: boolean): void => { this.log(`subtype switch result=${ok}`); })
      .catch((error: BusinessError): void => { this.log(`subtype switch error ${error.code} ${error.message}`); });
  }
  hidePanel(): void { this.hiddenForSession = true; this.syncPanel(); }
  softKey(key: string): void {
    const client = this.client;
    if (!client) { return; }
    try {
      if (key === 'Enter') {
        this.session.commit();
        client.sendKeyFunction(this.attribute?.enterKeyType ?? inputMethod.EnterKeyType.NEWLINE).catch((error: BusinessError): void => { this.fail(error); });
      } else if (!this.session.process(key)) {
        if (key === 'Backspace') { client.deleteForwardSync(1); }
        else { client.insertTextSync(key); }
      }
      this.publishState();
    } catch (error) { this.fail(error as BusinessError); }
  }
  private syncPanel(): void {
    this.panelQueue = this.panelQueue.then(async (): Promise<void> => {
      const panel = this.panel;
      if (!panel || !this.alive) { return; }
      const touchRequest = this.client?.getAttachOptions().requestKeyboardReason === inputMethodEngine.RequestKeyboardReason.TOUCH;
      const show = this.config.virtualKeyboard && (this.config.autoShow || touchRequest) && this.wantPanel && !!this.client && !this.hiddenForSession;
      if (show) {
        const screen = display.getDefaultDisplaySync();
        await panel.resize(screen.width, Math.round(this.config.keyboardHeight * screen.densityPixels));
        if (!this.alive) { return; }
        await panel.show();
      } else { await panel.hide(); }
      AppStorage.setOrCreate('imePanel', show ? 'Đang hiện' : 'Đang ẩn');
    }).catch((error: BusinessError): void => { this.fail(error); });
  }
  private publishState(): void {
    AppStorage.setOrCreate('imeMode', this.config.enabled ? this.session.getMode() : InputMode.English);
    AppStorage.setOrCreate('imeClient', !this.client ? 'Chưa gắn ô nhập' : (this.sensitive ? 'Ô được bảo vệ' : 'Đang gắn ô nhập'));
    AppStorage.setOrCreate('imeState', !this.alive ? 'Đã dừng' : (this.session.isFailed() ? 'Lỗi ô nhập: gõ thẳng' :
      (this.attribute && !this.attribute.isTextPreviewSupported ? (this.session.isDirect() ? 'Gõ trực tiếp' : 'Không hỗ trợ gạch chân: gõ thẳng') : 'Sẵn sàng')));
    AppStorage.setOrCreate('keyLabelSize', this.config.keyLabelSize);
    // No raw text, composition, bundle identifier or committed text enters diagnostics.
  }
  // Editor capability metadata only (never typed text); bundle name only in debug builds.
  private logEditor(event: string): void {
    if (!BuildProfile.DEBUG) { return; }
    const attr = this.attribute;
    if (!attr) { return; }
    let cursor = 'ok';
    try { this.client?.getTextIndexAtCursorSync(); } catch (error) { cursor = `err ${(error as BusinessError).code}`; }
    hilog.info(0x0F1E, 'VietIME', '%{public}s preview=%{public}s pattern=%{public}d direct=%{public}s sensitive=%{public}s cursor=%{public}s app=%{public}s',
      event, String(attr.isTextPreviewSupported), attr.inputPattern, String(this.session.isDirect()), String(this.sensitive), cursor,
      BuildProfile.DEBUG ? (attr.bundleName ?? '') : '-');
  }
  // Event metadata only (never typed text); debug builds only. Errors are always logged by fail().
  private log(message: string): void { if (BuildProfile.DEBUG) { hilog.info(0x0F1E, 'VietIME', '%{public}s', message); } }
  private fail(error: BusinessError): void {
    hilog.warn(0x0F1E, 'VietIME', 'framework error %{public}s %{public}s', String(error?.code), String(error?.message ?? error));
    if (!this.sensitive) { AppStorage.setOrCreate('imeError', `Framework error ${error.code}`); }
  }
}

export const imeRuntime: ImeRuntime = new ImeRuntime();
