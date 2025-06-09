import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import axios from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { LitterRobot4 } from './types';

const REGION = 'us-east-1';
const USER_POOL_CLIENT_ID = '4552ujeu3aic90nf8qn53levmn';
const API_ENDPOINT = 'https://lr4.iothings.site/graphql';
const USER_AGENT = 'amplify-flutter/2.6.1 ios/18.5 API/28';

const GRAPHQL_FIELDS: (keyof LitterRobot4)[] = [
  'name',
  'serial',
  'unitId',
  'unitPowerType',
  'unitPowerStatus',
  'robotStatus',
  'unitTimezone',
  'odometerCleanCycles',
  'DFINumberOfCycles',
  'isOnboarded',
  'isProvisioned',
  'sessionId',
  'lastSeen',
  'setupDateTime',
  'weightSensor',
  'cleanCycleWaitTime',
  'isKeypadLockout',
  'nightLightBrightness',
  'nightLightMode',
  'litterLevel',
  'DFILevelPercent',
  'globeMotorFaultStatus',
  'catWeight',
  'isBonnetRemoved',
  'isDFIFull',
  'wifiRssi',
  'isOnline',
  'espFirmware',
  'picFirmwareVersion',
  'laserBoardFirmwareVersion',
  'isFirmwareUpdateTriggered',
  'sleepStatus',
  'catDetect',
  'robotCycleState',
  'robotCycleStatus',
  'isLaserDirty',
  'panelBrightnessHigh',
  'smartWeightEnabled',
  'surfaceType',
  'hopperStatus',
  'isHopperRemoved',
  'scoopsSavedCount',
  'litterLevelPercentage',
  'litterLevelState',
];

const GRAPHQL_QUERY_ROBOTS_BY_USER = `
query GetLR4($userId: String!) {
  getLitterRobot4ByUser(userId: $userId) {
    ${GRAPHQL_FIELDS}
  }
}`;

export interface AuthConfig {
  username: string;
  password: string;
}

export class LitterRobot4Client {
  private readonly username: string;
  private readonly password: string;
  private readonly log: any; // Using any for now since we don't have access to Logging type
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private accessToken?: string;
  private idToken?: string;
  private refreshToken?: string;
  private userId?: string;

  constructor(config: AuthConfig, log: any) {
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
    axios.defaults.headers.common['User-Agent'] = USER_AGENT;
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

    if (!this.accessToken) {
      throw new Error('No access token received from Cognito');
    }

    const decoded: JwtPayload = jwt.decode(this.idToken || '') as JwtPayload;
    this.log.debug('idToken', this.idToken);
    this.log.debug('Decoded idToken', JSON.stringify(decoded, null, 2));
    this.userId = decoded?.['cognito:username'];
  }

  public async getRobots(): Promise<LitterRobot4[]> {
    await this.auth();
    this.log.info('Fetching robots using GraphQL');

    const graphqlQuery = {
      query: GRAPHQL_QUERY_ROBOTS_BY_USER,
      variables: {
        userId: this.userId,
      },
    };

    try {
      const response = await axios.post(API_ENDPOINT, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
        },
      });

      this.log.debug('GraphQL Response:', JSON.stringify(response.data, null, 2));

      const robots = response.data?.data?.getLitterRobot4ByUser as LitterRobot4[];
      if (robots && Array.isArray(robots)) {
        this.log.info(`Found ${robots.length} robot(s).`);
        return robots;
      }
      return [];
    } catch (error) {
      this.log.error(
        'Error fetching robots:',
        error instanceof Error ? error.message : String(error)
      );
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.log.warn('Auth token out of sync, refreshing');
        delete this.accessToken;
        return this.getRobots();
      }
      throw error;
    }
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
        mutation SendLR4Command($serial: String!, $command: String!, $value: String!) {
            sendLitterRobot4Command(input: {serial: $serial, command: $command, value: $value, commandSource: "HOMEKIT"})
        }
    `;
    return this.runMutation(mutation, { serial, command: 'POWER', value: power.toString() });
  }

  public async setNightLight(serial: string, value: boolean): Promise<void> {
    const mutation = `
        mutation SendLR4Command($serial: String!, $command: String!, $value: String!) {
            sendLitterRobot4Command(input: {serial: $serial, command: $command, value: $value, commandSource: "HOMEKIT"})
        }
    `;
    return this.runMutation(mutation, { serial, command: 'NIGHT_LIGHT', value: value.toString() });
  }

  public async startCleaning(serial: string): Promise<void> {
    const mutation = `
        mutation SendLR4Command($serial: String!, $command: String!) {
            sendLitterRobot4Command(input: {serial: $serial, command: $command, commandSource: "HOMEKIT"})
        }
    `;
    return this.runMutation(mutation, { serial, command: 'CLEAN' });
  }

  public async toggleHopper(serial: string, isRemoved: boolean): Promise<void> {
    const mutation = `
        mutation ToggleHopper($serial: String!, $isRemoved: Boolean!) {
            toggleHopper(serial: $serial, isRemoved: $isRemoved) {
                success
            }
        }
    `;
    return this.runMutation(mutation, { serial, isRemoved });
  }
}
