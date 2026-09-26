import { InputMethodExtensionAbility } from '@kit.IMEKit';
import { Want } from '@kit.AbilityKit';
import { imeRuntime } from './ImeRuntime';

export default class VietIMEExtension extends InputMethodExtensionAbility {
  onCreate(want: Want): void { imeRuntime.create(this.context); }
  onDestroy(): void { imeRuntime.destroy(); }
}
