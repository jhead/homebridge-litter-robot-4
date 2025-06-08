import { API } from 'homebridge';
import { LitterRobotPlatform } from './platform';

export default function (homebridge: API): void {
  homebridge.registerPlatform(
    LitterRobotPlatform.PLUGIN_NAME,
    LitterRobotPlatform.PLATFORM_NAME,
    LitterRobotPlatform
  );
}
