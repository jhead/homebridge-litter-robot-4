import { Service, Characteristic, CharacteristicValue, Logger } from 'homebridge';
import { LitterRobotPlatform } from './platform';
import { LitterRobotConnect } from './litter-robot-connect';
import { LitterRobot4 } from './types';

export class LitterRobotDevice {
  private readonly connect: LitterRobotConnect;
  private readonly platform: LitterRobotPlatform;
  public readonly id: string;
  public readonly name: string;
  public readonly serial: string;
  private details: LitterRobot4;
  private filterService?: Service;
  private switchService?: Service;
  private nightlightService?: Service;
  private occupancyService?: Service;
  private trayService?: Service;
  private weightService?: Service;

  constructor(connect: LitterRobotConnect, platform: LitterRobotPlatform, details: LitterRobot4) {
    if (!connect) {
      throw new Error('LitterRobotConnect instance is required');
    }
    if (!platform) {
      throw new Error('LitterRobotPlatform instance is required');
    }
    if (!details) {
      throw new Error('Robot details are required');
    }
    if (!details.unitId) {
      throw new Error('Robot unitId is required');
    }
    if (!details.name) {
      throw new Error('Robot name is required');
    }
    if (!details.serial) {
      throw new Error('Robot serial is required');
    }

    this.connect = connect;
    this.platform = platform;
    this.id = details.unitId;
    this.name = details.name;
    this.serial = details.serial;
    this.details = details;

    this.platform.log.info(`Initialized device: ${this.name} (${this.serial})`);
  }

  public updateDetails(details: LitterRobot4): void {
    this.details = details;
    this.platform.log.debug(`Updated details for ${this.name}:`, {
      powerStatus: details.unitPowerStatus,
      robotStatus: details.robotStatus,
      cycleState: details.robotCycleState,
      nightLightMode: details.nightLightMode,
      isDFIFull: details.isDFIFull,
      DFILevelPercent: details.DFILevelPercent,
      catWeight: details.catWeight,
    });

    // Push updates to HomeKit
    if (this.filterService) {
      const filterLife = this.getFilterLife();
      const filterChange = this.getFilterChange();

      this.platform.log.debug(`Updating filter service:`, {
        filterLife,
        filterChange,
      });

      this.filterService.updateCharacteristic(
        this.platform.api.hap.Characteristic.FilterLifeLevel,
        filterLife
      );
      this.filterService.updateCharacteristic(
        this.platform.api.hap.Characteristic.FilterChangeIndication,
        filterChange
      );
    }

    if (this.switchService) {
      const filterLife = this.getFilterLife();
      this.platform.log.debug(`Updating switch service: filterLife=${filterLife}`);
      this.switchService.updateCharacteristic(
        this.platform.api.hap.Characteristic.On,
        filterLife < 100.0
      );
    }

    if (this.nightlightService) {
      const nightlight = this.getNightlight();
      this.platform.log.debug(`Updating nightlight service: nightlight=${nightlight}`);
      this.nightlightService.updateCharacteristic(
        this.platform.api.hap.Characteristic.On,
        nightlight
      );
    }

    if (this.occupancyService) {
      const occupancy = this.getOccupancy();
      const fault = this.getOccupancyFault();
      this.platform.log.debug(`Updating occupancy service:`, {
        occupancy,
        fault,
      });
      this.occupancyService.updateCharacteristic(
        this.platform.api.hap.Characteristic.OccupancyDetected,
        occupancy
      );
      this.occupancyService.updateCharacteristic(
        this.platform.api.hap.Characteristic.StatusActive,
        !fault
      );
      this.occupancyService.updateCharacteristic(
        this.platform.api.hap.Characteristic.StatusFault,
        fault
      );
    }

    if (this.trayService) {
      const filterChange = this.getFilterChange();
      this.platform.log.debug(`Updating tray service: filterChange=${filterChange}`);
      this.trayService.updateCharacteristic(
        this.platform.api.hap.Characteristic.OccupancyDetected,
        filterChange
      );
    }

    if (this.weightService) {
      const weight = this.getCatWeight();
      this.platform.log.debug(`Updating weight service: weight=${weight}`);
      this.weightService.updateCharacteristic(
        this.platform.api.hap.Characteristic.CurrentTemperature,
        weight
      );
    }
  }

  public setFilterService(service: Service): void {
    this.filterService = service;
    this.filterService
      .getCharacteristic(this.platform.api.hap.Characteristic.FilterLifeLevel)
      .on('get', async (callback) => {
        this.platform.log.info('Filter life state requested');
        callback(null, this.getFilterLife());
      });

    this.filterService
      .getCharacteristic(this.platform.api.hap.Characteristic.FilterChangeIndication)
      .on('get', async (callback) => {
        this.platform.log.info('Filter change state requested');
        callback(null, this.getFilterChange());
      });
  }

  public setSwitchService(service: Service): void {
    this.switchService = service;
    this.switchService
      .getCharacteristic(this.platform.api.hap.Characteristic.On)
      .on('get', async (callback) => {
        this.platform.log.info('Reset switch state requested');
        callback(null, this.getFilterLife() < 100.0);
      })
      .on('set', async (value: CharacteristicValue, callback) => {
        this.platform.log.info('Reset switch state changed');
        let err = null;
        const power = this.getPower();
        if (!power || this.getFilterLife() === 100.0) {
          // Gauge cannot be reset when powered off or at 0% capacity
          err = new Error('Waste level gauge cannot be reset at this time!');
        } else {
          try {
            await this.resetGauge(value as boolean);
          } catch (e) {
            err = e;
          }
        }
        callback(err as Error | null);
      });
  }

  public setNightlightService(service: Service): void {
    this.nightlightService = service;
    this.nightlightService
      .getCharacteristic(this.platform.api.hap.Characteristic.On)
      .on('get', async (callback) => {
        this.platform.log.info('Nightlight state requested');
        const value = this.getNightlight();
        callback(null, value);
      })
      .on('set', async (value: CharacteristicValue, callback) => {
        this.platform.log.info('Nightlight state changed');
        let err = null;
        const power = this.getPower();
        if (!power) {
          // Nightlight cannot be controlled if no power
          err = new Error('Nightlight cannot be controlled while device is powered off!');
        } else {
          try {
            await this.setNightlight(value as boolean);
          } catch (e) {
            err = e;
          }
        }
        callback(err as Error | null);
      });
  }

  public setOccupancyService(service: Service): void {
    this.occupancyService = service;
    this.occupancyService
      .getCharacteristic(this.platform.api.hap.Characteristic.OccupancyDetected)
      .on('get', async (callback) => {
        this.platform.log.info('Occupancy state requested');
        const value = this.getOccupancy();
        callback(null, value);
      });
    this.occupancyService
      .getCharacteristic(this.platform.api.hap.Characteristic.StatusActive)
      .on('get', async (callback) => {
        this.platform.log.info('Occupancy status state requested');
        const value = this.getOccupancyFault();
        callback(null, !value);
      });
    this.occupancyService
      .getCharacteristic(this.platform.api.hap.Characteristic.StatusFault)
      .on('get', async (callback) => {
        this.platform.log.info('Occupancy status state requested');
        const value = this.getOccupancyFault();
        callback(null, value);
      });
  }

  public setTrayService(service: Service): void {
    this.trayService = service;
    this.trayService
      .getCharacteristic(this.platform.api.hap.Characteristic.OccupancyDetected)
      .on('get', async (callback) => {
        this.platform.log.info('Tray state requested');
        const value = this.getFilterChange();
        callback(null, value);
      });
    this.trayService
      .getCharacteristic(this.platform.api.hap.Characteristic.StatusActive)
      .on('get', async (callback) => {
        this.platform.log.info('Tray status state requested');
        const value = this.getOccupancyFault();
        callback(null, !value);
      });
    this.trayService
      .getCharacteristic(this.platform.api.hap.Characteristic.StatusFault)
      .on('get', async (callback) => {
        this.platform.log.info('Tray status state requested');
        const value = this.getOccupancyFault();
        callback(null, value);
      });
  }

  public setWeightService(service: Service): void {
    this.weightService = service;
    this.weightService
      .getCharacteristic(this.platform.api.hap.Characteristic.CurrentTemperature)
      .on('get', async (callback) => {
        this.platform.log.info('Cat weight requested');
        const value = this.getCatWeight();
        callback(null, value);
      });
  }

  public async sync(): Promise<void> {
    const robot = await this.connect.getRobot(this.serial);
    if (robot) {
      this.updateDetails(robot);
    } else {
      this.platform.log.warn(`Failed to sync robot ${this.name} (${this.serial})`);
    }
  }

  public getPower(): boolean {
    const value = this.details.isOnline && this.details.unitPowerStatus !== 'OFF';
    this.platform.log.debug(`getPower for ${this.name}:`, {
      isOnline: this.details.isOnline,
      powerStatus: this.details.unitPowerStatus,
      result: value,
    });
    return value;
  }

  public async setPower(value: boolean): Promise<void> {
    this.platform.log.info(`Setting power for ${this.name} to ${value}`);
    return await this.connect.setPower(this.serial, value);
  }

  public getNightlight(): boolean {
    const value = this.details.nightLightMode !== 'OFF';
    this.platform.log.debug(`getNightlight for ${this.name}:`, {
      nightLightMode: this.details.nightLightMode,
      result: value,
    });
    return value;
  }

  public async setNightlight(value: boolean): Promise<void> {
    this.platform.log.info(`Setting nightlight for ${this.name} to ${value}`);
    return await this.connect.setNightLight(this.serial, value);
  }

  public getOccupancy(): boolean {
    const value = this.details.robotCycleState === 'CAT_DETECTED';
    this.platform.log.debug(`getOccupancy for ${this.name}:`, {
      cycleState: this.details.robotCycleState,
      result: value,
    });
    return value;
  }

  public getOccupancyFault(): boolean {
    const value = this.details.isDFIFull;
    this.platform.log.debug(`getOccupancyFault for ${this.name}:`, {
      isDFIFull: this.details.isDFIFull,
      result: value,
    });
    return value;
  }

  public getMotion(): boolean {
    const value = this.details.robotCycleState === 'CLEAN_CYCLE';
    this.platform.log.debug(`getMotion for ${this.name}:`, {
      cycleState: this.details.robotCycleState,
      result: value,
    });
    return value;
  }

  public getFilterLife(): number {
    const value = 100 - this.details.DFILevelPercent;
    this.platform.log.debug(`getFilterLife for ${this.name}:`, {
      DFILevelPercent: this.details.DFILevelPercent,
      result: value,
    });
    return value;
  }

  public getFilterChange(): boolean {
    const value = this.details.isDFIFull;
    this.platform.log.debug(`getFilterChange for ${this.name}:`, {
      isDFIFull: this.details.isDFIFull,
      result: value,
    });
    return value;
  }

  public async runCycle(): Promise<void> {
    this.platform.log.info(`Starting cleaning cycle for ${this.name}`);
    return await this.connect.startCleaning(this.serial);
  }

  public async resetGauge(value: boolean): Promise<void> {
    this.platform.log.info(`Resetting waste drawer gauge for ${this.name}`);
    if (value) {
      await this.connect.resetWasteDrawerGauge(this.serial);
    }
    this.switchService?.updateCharacteristic(this.platform.api.hap.Characteristic.On, false);
  }

  public getCatWeight(): number {
    const value = this.details.catWeight;
    this.platform.log.debug(`getCatWeight for ${this.name}:`, {
      catWeight: this.details.catWeight,
      result: value,
    });
    return value;
  }

  private getCurrentAirPurifierState(): CharacteristicValue {
    if (!this.getPower()) {
      return this.platform.api.hap.Characteristic.CurrentAirPurifierState.INACTIVE;
    }
    if (this.getMotion()) {
      return this.platform.api.hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
    }
    return this.platform.api.hap.Characteristic.CurrentAirPurifierState.IDLE;
  }
}
