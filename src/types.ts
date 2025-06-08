// Define the type for sleep mode settings
export type SleepModeSettings = {
  sleepTime: number;
  wakeTime: number;
  isEnabled: boolean;
};

// Define the type for weekday sleep mode
export type WeekdaySleepMode = {
  Sunday: SleepModeSettings;
  Monday: SleepModeSettings;
  Tuesday: SleepModeSettings;
  Wednesday: SleepModeSettings;
  Thursday: SleepModeSettings;
  Friday: SleepModeSettings;
  Saturday: SleepModeSettings;
};

// Define the main robot type
export type LitterRobot4 = {
  name: string;
  serial: string;
  unitId: string;
  unitPowerType: string;
  unitPowerStatus: string;
  robotStatus: string;
  unitTimezone: string;
  odometerCleanCycles: number;
  DFINumberOfCycles: number;
  isOnboarded: boolean;
  isProvisioned: boolean;
  sessionId: string;
  lastSeen: string;
  setupDateTime: string;
  weightSensor: number;
  cleanCycleWaitTime: number;
  isKeypadLockout: boolean;
  nightLightBrightness: number;
  nightLightMode: string;
  litterLevel: number;
  DFILevelPercent: number;
  globeMotorFaultStatus: string;
  catWeight: number;
  isBonnetRemoved: boolean;
  isDFIFull: boolean;
  wifiRssi: number;
  isOnline: boolean;
  espFirmware: string;
  picFirmwareVersion: string;
  laserBoardFirmwareVersion: string;
  isFirmwareUpdateTriggered: boolean;
  sleepStatus: string;
  catDetect: string;
  robotCycleState: string;
  robotCycleStatus: string;
  isLaserDirty: boolean;
  panelBrightnessHigh: number;
  smartWeightEnabled: boolean;
  surfaceType: string;
  hopperStatus: string;
  isHopperRemoved: boolean;
  scoopsSavedCount: number;
  litterLevelPercentage: number;
  litterLevelState: string;
  weekdaySleepModeEnabled: WeekdaySleepMode;
};

export interface RobotData {
  litterRobotId: string;
  litterRobotNickname: string;
  litterRobotSerial: string;
  unitStatus: string;
  nightLightActive: boolean;
  cycleCount: number;
  cycleCapacity: number;
  cyclesAfterDrawerFull: number;
  isOnboarded: boolean;
}

export interface AuthConfig {
  username: string;
  password: string;
}

export interface CommandResponse {
  _developerMessage?: string;
}
