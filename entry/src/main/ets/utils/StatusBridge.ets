import { commonEventManager, BusinessError } from '@kit.BasicServicesKit';

const BUNDLE: string = 'com.vietime.inputmethod';
const REQUEST: string = BUNDLE + '.STATUS_REQUEST';
const RESPONSE: string = BUNDLE + '.STATUS_RESPONSE';

export class ImeStatus {
  state: string = 'Unknown';
  mode: string = 'Unknown';
  client: string = 'Unknown';
  panel: string = 'Unknown';
  timestamp: number = 0;
}

// Only metadata, only on demand, only within our bundle. Never transports typed text.
export class StatusBridge {
  private subscriber: commonEventManager.CommonEventSubscriber | undefined = undefined;
  private closed: boolean = false;
  private reply = (event: string, data: string): void => {
    try { commonEventManager.publish(event, { bundleName: BUNDLE, data: data }, (error: BusinessError): void => {}); }
    catch (error) { /* Diagnostics must not interrupt typing. */ }
  };
  serve(snapshot: () => ImeStatus): void {
    try {
      this.subscriber = commonEventManager.createSubscriberSync({ events: [REQUEST], publisherBundleName: BUNDLE });
      commonEventManager.subscribe(this.subscriber, (error: BusinessError, event: commonEventManager.CommonEventData): void => {
        if (!error && !this.closed && event.event === REQUEST) { this.reply(RESPONSE, JSON.stringify(snapshot())); }
      });
    } catch (error) { /* The extension remains usable without diagnostics IPC. */ }
  }
  observe(callback: (status: ImeStatus) => void): void {
    try {
      this.subscriber = commonEventManager.createSubscriberSync({ events: [RESPONSE], publisherBundleName: BUNDLE });
      commonEventManager.subscribe(this.subscriber, (error: BusinessError, event: commonEventManager.CommonEventData): void => {
        if (error || this.closed || event.event !== RESPONSE || !event.data) { return; }
        try { callback(JSON.parse(event.data) as ImeStatus); } catch (error) { /* Ignore malformed diagnostic packets. */ }
      });
    } catch (error) { /* Unknown is displayed instead of claiming extension is stopped. */ }
  }
  request(): void { this.reply(REQUEST, ''); }
  close(): void {
    this.closed = true;
    try { if (this.subscriber) { commonEventManager.unsubscribe(this.subscriber); } }
    catch (error) { /* Best effort during teardown. */ }
    this.subscriber = undefined;
  }
}

// Settings UI and IME extension run in different processes and Preferences multiProcessChange
// is unavailable on HarmonyOS PC 6.1 (15500000), so the UI signals saves through a bundle-only event.
const SETTINGS_CHANGED: string = BUNDLE + '.SETTINGS_CHANGED';
export class SettingsSignal {
  private subscriber: commonEventManager.CommonEventSubscriber | undefined = undefined;
  static notify(): void {
    try { commonEventManager.publish(SETTINGS_CHANGED, { bundleName: BUNDLE }, (error: BusinessError): void => {}); }
    catch (error) { /* The IME still reloads settings on the next inputStart. */ }
  }
  listen(callback: () => void): void {
    try {
      this.subscriber = commonEventManager.createSubscriberSync({ events: [SETTINGS_CHANGED], publisherBundleName: BUNDLE });
      commonEventManager.subscribe(this.subscriber, (error: BusinessError, event: commonEventManager.CommonEventData): void => {
        if (!error && event.event === SETTINGS_CHANGED) { callback(); }
      });
    } catch (error) { /* Falls back to reloading on inputStart. */ }
  }
  close(): void {
    try { if (this.subscriber) { commonEventManager.unsubscribe(this.subscriber); } } catch (error) { /* teardown */ }
    this.subscriber = undefined;
  }
}
