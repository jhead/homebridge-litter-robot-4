import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import axios, { AxiosResponse } from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Logging } from 'homebridge';
import { LitterRobotDevice } from './device';
import { LitterRobotPlatform } from './platform';
import { LitterRobot4, RobotData, AuthConfig, CommandResponse } from './types';

const REGION = 'us-east-1';
const USER_POOL_CLIENT_ID = '4552ujeu3aic90nf8qn53levmn';
const API_ENDPOINT = 'https://lr4.iothings.site/graphql';

// Define the type for sleep mode settings
type SleepModeSettings = {
  sleepTime: number;
  wakeTime: number;
  isEnabled: boolean;
};

// Define the type for weekday sleep mode
type WeekdaySleepMode = {
  Sunday: SleepModeSettings;
  Monday: SleepModeSettings;
  Tuesday: SleepModeSettings;
  Wednesday: SleepModeSettings;
  Thursday: SleepModeSettings;
  Friday: SleepModeSettings;
  Saturday: SleepModeSettings;
};

export class LitterRobotConnect {
  private readonly username: string;
  private readonly password: string;
  private readonly log: Logging;
  private deviceInfo: Map<string, { id: string; name: string; serial: string }> = new Map();
  private devices: Map<string, LitterRobotDevice> = new Map();
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private accessToken?: string;
  private idToken?: string;
  private refreshToken?: string;
  private userId?: string;

  constructor(config: AuthConfig, log: Logging) {
    if (!config.username) throw new Error('No username provided!');
    if (!config.password) throw new Error('No password provided!');

    this.username = config.username;
    this.password = config.password;
    this.log = log;
    this.cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
  }

  private async auth(): Promise<void> {
    if (!this.accessToken) {
      delete axios.defaults.headers.common['Authorization'];
      this.log.info('No access token found, logging in');
      await this.login();
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  private async login(): Promise<void> {
    // If we already have a refresh token, try to refresh
    if (this.refreshToken) {
      this.log.info('Using refresh token');
      try {
        await this._cognitoInitiate({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: {
            REFRESH_TOKEN: this.refreshToken,
            CLIENT_ID: USER_POOL_CLIENT_ID,
          },
          ClientId: USER_POOL_CLIENT_ID,
        });
        return;
      } catch (err) {
        // if refresh fails, fall back to password flow
        if (
          err instanceof Error &&
          (err.name === 'NotAuthorizedException' || (err as any).$metadata?.httpStatusCode === 400)
        ) {
          this.log.warn('Refresh token invalid, will fall back to password login');
          delete this.refreshToken;
        } else {
          throw err;
        }
      }
    }

    // Password flow
    this.log.info('Using account login');
    await this._cognitoInitiate({
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: this.username,
        PASSWORD: this.password,
      },
      ClientId: USER_POOL_CLIENT_ID,
    });
  }

  private async _cognitoInitiate(opts: InitiateAuthCommandInput): Promise<void> {
    const params = {
      ...opts,
      // ensure ClientId if not in AuthParameters
      ClientId: opts.ClientId || USER_POOL_CLIENT_ID,
    };
    const cmd = new InitiateAuthCommand(params);
    const resp = await this.cognitoClient.send(cmd);

    if (!resp.AuthenticationResult) {
      throw new Error(`Cognito auth failed or requires challenge: ${JSON.stringify(resp)}`);
    }

    this.accessToken = resp.AuthenticationResult.AccessToken;
    this.idToken = resp.AuthenticationResult.IdToken;
    this.refreshToken = resp.AuthenticationResult.RefreshToken;

    console.log(JSON.stringify(this.idToken));

    if (!this.accessToken) {
      throw new Error('No access token received from Cognito');
    }

    const decoded: JwtPayload = jwt.decode(this.idToken || '') as JwtPayload;
    this.log.debug('Decoded idToken', JSON.stringify(decoded, null, 2));
    // get cognito:username from token
    this.userId = decoded?.['cognito:username'];
  }

  public async sync(platform: LitterRobotPlatform): Promise<void> {
    await this.auth();
    this.log.info('Syncing robots using GraphQL');

    const graphqlQuery = {
      query: `
        query GetLR4($userId: String!) {
          getLitterRobot4ByUser(userId: $userId) {
            name
            serial
            unitId
            unitPowerType
            unitPowerStatus
            robotStatus
            unitTimezone
            odometerCleanCycles
            DFINumberOfCycles
            isOnboarded
            isProvisioned
            sessionId
            lastSeen
            setupDateTime
            weightSensor
            cleanCycleWaitTime
            isKeypadLockout
            nightLightBrightness
            nightLightMode
            litterLevel
            DFILevelPercent
            globeMotorFaultStatus
            catWeight
            isBonnetRemoved
            isDFIFull
            wifiRssi
            isOnline
            espFirmware
            picFirmwareVersion
            laserBoardFirmwareVersion
            isFirmwareUpdateTriggered
            sleepStatus
            catDetect
            robotCycleState
            robotCycleStatus
            isLaserDirty
            panelBrightnessHigh
            smartWeightEnabled
            surfaceType
            hopperStatus
            isHopperRemoved
            scoopsSavedCount
            litterLevelPercentage
            litterLevelState
            weekdaySleepModeEnabled {
              Sunday {
                sleepTime
                wakeTime
                isEnabled
              }
              Monday {
                sleepTime
                wakeTime
                isEnabled
              }
              Tuesday {
                sleepTime
                wakeTime
                isEnabled
              }
              Wednesday {
                sleepTime
                wakeTime
                isEnabled
              }
              Thursday {
                sleepTime
                wakeTime
                isEnabled
              }
              Friday {
                sleepTime
                wakeTime
                isEnabled
              }
              Saturday {
                sleepTime
                wakeTime
                isEnabled
              }
            }
          }
        }
      `,
      variables: {
        userId: this.userId,
      },
    };

    try {
      const response = await axios.post(API_ENDPOINT, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'amplify-flutter/2.6.1 ios/18.5 API/28',
        },
      });

      this.log.debug('GraphQL Response:', JSON.stringify(response.data, null, 2));

      const robots = response.data?.data?.getLitterRobot4ByUser as LitterRobot4[];
      if (robots && Array.isArray(robots)) {
        this.log.info(`Discovered ${robots.length} robot(s).`);

        // Track which devices we've seen in this sync
        const seenDevices = new Set<string>();

        // Process each robot
        for (const robot of robots) {
          if (robot.isOnboarded) {
            try {
              seenDevices.add(robot.unitId);

              // Check if we already have this device
              const existingDevice = this.devices.get(robot.unitId);
              if (existingDevice) {
                // Update existing device
                this.log.debug(`Updating existing device: ${robot.name}`);
                existingDevice.updateDetails(robot);
              } else {
                // Add new device
                this.log.info(`Adding new device: ${robot.name}`);
                const device = new LitterRobotDevice(this, platform, robot);
                this.devices.set(device.id, device);
                this.deviceInfo.set(device.id, {
                  id: device.id,
                  name: device.name,
                  serial: device.serial,
                });
                platform.addAccessory(device);
              }
            } catch (error) {
              this.log.error(
                `Error processing robot ${robot.name}:`,
                error instanceof Error ? error.message : String(error)
              );
            }
          }
        }

        // Remove devices that are no longer present
        for (const [deviceId, deviceInfo] of this.deviceInfo.entries()) {
          if (!seenDevices.has(deviceId)) {
            this.log.info(`Removing device that is no longer present: ${deviceInfo.name}`);
            this.deviceInfo.delete(deviceId);
            const device = this.devices.get(deviceId);
            if (device) {
              this.devices.delete(deviceId);
              platform.removeAccessory(device);
            }
          }
        }
      } else {
        this.log.warn('Could not find robots in GraphQL response.');
      }
    } catch (error) {
      this.log.error(
        'Error syncing robots:',
        error instanceof Error ? error.message : String(error)
      );
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.log.warn('Auth token out of sync, refreshing');
        delete this.accessToken;
        return this.sync(platform);
      }
      throw error;
    }
  }

  public async getRobot(serial: string): Promise<LitterRobot4 | undefined> {
    await this.auth();
    this.log.info(`Fetching robot data for ${serial}`);

    const graphqlQuery = {
      query: `
            query GetLR4($serial: String!) {
                getLitterRobot(serial: $serial) {
                    name
                    serial
                    unitId
                    unitPowerType
                    unitPowerStatus
                    robotStatus
                    unitTimezone
                    unitPowerStatus
                    odometerCleanCycles
                    DFINumberOfCycles
                    isOnboarded
                    isProvisioned
                    sessionId
                    lastSeen
                    setupDateTime
                    weightSensor
                    cleanCycleWaitTime
                    isKeypadLockout
                    nightLightBrightness
                    nightLightMode
                    litterLevel
                    DFILevelPercent
                    globeMotorFaultStatus
                    catWeight
                    isBonnetRemoved
                    isDFIFull
                    wifiRssi
                    isOnline
                    espFirmware
                    picFirmwareVersion
                    laserBoardFirmwareVersion
                    isFirmwareUpdateTriggered
                    sleepStatus
                    catDetect
                    robotCycleState
                    robotCycleStatus
                    isLaserDirty
                    panelBrightnessHigh
                    smartWeightEnabled
                    surfaceType
                    hopperStatus
                    isHopperRemoved
                    scoopsSavedCount
                    litterLevelPercentage
                    litterLevelState
                }
            }
        `,
      variables: {
        serial: serial,
      },
    };

    const response = await axios.post(API_ENDPOINT, graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'amplify-flutter/2.6.1 ios/18.5 API/28',
      },
    });

    return response.data?.data?.getLitterRobot as LitterRobot4 | undefined;
  }

  private async runMutation(mutation: string, variables: Record<string, unknown>): Promise<void> {
    await this.auth();
    const graphqlQuery = {
      query: mutation,
      variables,
    };

    try {
      const response = await axios.post(API_ENDPOINT, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'amplify-flutter/2.6.1 ios/18.5 API/28',
        },
      });
      this.log.debug(JSON.stringify(response.data));
    } catch (e) {
      this.log.error('Error running mutation:', e instanceof Error ? e.message : String(e));
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        this.log.warn('Auth token out of sync, refreshing');
        delete this.accessToken;
        return this.runMutation(mutation, variables);
      }
      throw e;
    }
  }

  public async setPower(serial: string, power: boolean): Promise<void> {
    const mutation = `
        mutation SetPower($serial: String!, $power: Boolean!) {
            setPower(serial: $serial, power: $power)
        }
    `;
    return this.runMutation(mutation, { serial, power });
  }

  public async setNightLight(serial: string, value: boolean): Promise<void> {
    const mutation = `
        mutation SetNightLight($serial: String!, $value: Boolean!) {
            setNightLight(serial: $serial, value: $value)
        }
    `;
    return this.runMutation(mutation, { serial, value });
  }

  public async startCleaning(serial: string): Promise<void> {
    const mutation = `
        mutation StartCleaning($serial: String!) {
            startCleaning(serial: $serial)
        }
    `;
    return this.runMutation(mutation, { serial });
  }

  public async resetWasteDrawerGauge(serial: string): Promise<void> {
    const mutation = `
        mutation ResetWasteDrawerGauge($serial: String!) {
            resetWasteDrawerGauge(serial: $serial)
        }
    `;
    return this.runMutation(mutation, { serial });
  }

  public getDevices(): Map<string, { id: string; name: string; serial: string }> {
    return this.deviceInfo;
  }
}
