import {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';
import { LitterRobotConnect } from './api';
import { LitterRobotDevice } from './device';

export class LitterRobotPlatform implements DynamicPlatformPlugin {
  public static readonly PLUGIN_NAME = '@jhead/homebridge-litter-robot-4';
  public static readonly PLATFORM_NAME = 'LitterRobotPlatform';

  public readonly api: API;
  public readonly log: Logging;
  private readonly config: PlatformConfig;
  private readonly connect: LitterRobotConnect;
  private readonly accessories: Map<string, PlatformAccessory> = new Map();
  private pollInterval?: NodeJS.Timeout;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config;
    this.api = api;

    if (!this.config) {
      this.log.warn('No configuration found for Litter-Robot Connect');
      this.connect = new LitterRobotConnect({ username: '', password: '' }, this.log);
      return;
    }

    if (!this.config.username || !this.config.password) {
      this.log.warn('No username or password found in configuration');
      this.connect = new LitterRobotConnect({ username: '', password: '' }, this.log);
      return;
    }

    this.connect = new LitterRobotConnect(
      {
        username: this.config.username,
        password: this.config.password,
      },
      this.log
    );

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
    this.api.on('shutdown', this.shutdown.bind(this));
  }

  public configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Ignoring cached accessory:', accessory.displayName);
    // We'll let the sync process handle device discovery and setup
  }

  private async didFinishLaunching(): Promise<void> {
    try {
      await this.connect.sync(this);
      this.log.info('Finished launching');

      // Start polling if pollingFrequency is configured
      const pollingFrequency = this.config.pollingFrequency || 300; // 5 minutes
      this.log.info(`Starting polling every ${pollingFrequency} seconds`);

      this.pollInterval = setInterval(async () => {
        try {
          await this.connect.sync(this);
        } catch (error) {
          this.log.error('Error during polling sync:', error);
        }
      }, pollingFrequency * 1000);
    } catch (error) {
      this.log.error('Error during launch:', error);
    }
  }

  private shutdown(): void {
    this.log.info('Shutting down');
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  public addAccessory(device: LitterRobotDevice): void {
    const uuid = this.api.hap.uuid.generate(device.id);

    let accessory = this.accessories.get(uuid);

    if (accessory) {
      this.log.debug(`Updating existing accessory: ${device.name} (${device.id})`);
      accessory.displayName = device.name;
      accessory.context.device = {
        id: device.id,
        name: device.name,
        serial: device.serial,
      };
    } else {
      this.log.info(`Adding new accessory: ${device.name} (${device.id})`);
      accessory = new this.api.platformAccessory(device.name, uuid);

      accessory.context.device = {
        id: device.id,
        name: device.name,
        serial: device.serial,
      };

      device.setFilterService(accessory.addService(this.api.hap.Service.FilterMaintenance));
      device.setNightlightService(accessory.addService(this.api.hap.Service.Lightbulb));
      device.setWeightService(accessory.addService(this.api.hap.Service.TemperatureSensor));

      const catPresenceSensor = new this.api.hap.Service.OccupancySensor(
        'Cat Presence',
        'CatPresence'
      );
      const trayFullSensor = new this.api.hap.Service.OccupancySensor('Tray Full', 'TrayFull');

      device.setOccupancyService(catPresenceSensor);
      device.setTrayService(trayFullSensor);

      const weightSensor = new this.api.hap.Service.TemperatureSensor('Cat Weight', 'CatWeight');
      device.setWeightService(weightSensor);

      this.api.registerPlatformAccessories(
        LitterRobotPlatform.PLUGIN_NAME,
        LitterRobotPlatform.PLATFORM_NAME,
        [accessory]
      );
    }

    this.accessories.set(uuid, accessory);
  }

  public removeAccessory(device: LitterRobotDevice): void {
    const uuid = this.api.hap.uuid.generate(device.id);
    const accessory = this.accessories.get(uuid);
    if (accessory) {
      this.api.unregisterPlatformAccessories(
        LitterRobotPlatform.PLUGIN_NAME,
        LitterRobotPlatform.PLATFORM_NAME,
        [accessory]
      );
      this.accessories.delete(uuid);
    }
  }
}
