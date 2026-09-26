import { UIAbility, Want, AbilityConstant } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { BusinessError } from '@kit.BasicServicesKit';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {}
  onWindowStageCreate(stage: window.WindowStage): void {
    stage.loadContent('pages/Index').catch((error: BusinessError): void => {
      AppStorage.setOrCreate('uiLoadError', error.code);
    });
  }
}
