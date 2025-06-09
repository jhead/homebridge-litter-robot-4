import { Logging } from 'homebridge';
import { LitterRobotDevice } from './device';
import { LitterRobotPlatform } from './platform';
import { LitterRobot4, AuthConfig } from './api/types';
import { LitterRobot4Client } from './api/litterRobot4Client';

export class LitterRobotConnect {
  private readonly client: LitterRobot4Client;
  private readonly log: Logging;
  private deviceInfo: Map<string, { id: string; name: string; serial: string }> = new Map();
  private devices: Map<string, LitterRobotDevice> = new Map();

  constructor(config: AuthConfig, log: Logging) {
    this.log = log;
    this.client = new LitterRobot4Client(config, log);
  }

  public async sync(platform: LitterRobotPlatform): Promise<void> {
    this.log.info('Syncing robots');
    try {
      const robots = await this.client.getRobots();

      // Track which devices we've seen in this sync
      const seenDevices = new Set<string>();

      // Process each robot
      for (const robot of robots) {
        if (!robot.isOnboarded) continue;
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
            const device = new LitterRobotDevice(this.client, platform, robot);
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
    } catch (error) {
      this.log.error(
        'Error syncing robots:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  public getDevices(): Map<string, { id: string; name: string; serial: string }> {
    return this.deviceInfo;
  }
}
