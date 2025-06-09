import { LitterRobotConnect } from '../src/api';
import { Logging } from 'homebridge';

// Create a logger function that implements the Logging interface
function createLogger(): Logging {
  const logger = function (message: string, ...parameters: any[]): void {
    console.log(message, ...parameters);
  } as Logging;

  logger.prefix = '';

  logger.info = (message: string, ...parameters: any[]): void => {
    console.log(`[INFO] ${message}`, ...parameters);
  };

  logger.warn = (message: string, ...parameters: any[]): void => {
    console.log(`[WARN] ${message}`, ...parameters);
  };

  logger.error = (message: string, ...parameters: any[]): void => {
    console.log(`[ERROR] ${message}`, ...parameters);
  };

  logger.debug = (message: string, ...parameters: any[]): void => {
    console.log(`[DEBUG] ${message}`, ...parameters);
  };

  logger.log = (message: string, ...parameters: any[]): void => {
    console.log(message, ...parameters);
  };

  logger.success = (message: string, ...parameters: any[]): void => {
    console.log(`[SUCCESS] ${message}`, ...parameters);
  };

  return logger;
}

async function main() {
  const logger = createLogger();

  // Get credentials from command line arguments
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: ts-node auth-test.ts <username> <password>');
    process.exit(1);
  }

  logger.info('Starting authentication test...');

  try {
    const connect = new LitterRobotConnect({ username, password }, logger);

    // Try to sync robots to verify full functionality
    logger.info('Attempting to sync robots...');
    await connect.sync({} as any); // Using empty platform object for testing

    // Check discovered devices
    const devices = connect.getDevices();
    if (devices && devices.size > 0) {
      logger.info(`Discovered ${devices.size} robot(s).`);
      devices.forEach((deviceInfo, id) => {
        logger.info(`Robot #${id}:`, {
          name: deviceInfo.name,
          serial: deviceInfo.serial,
        });
      });
    } else {
      logger.warn('No devices found.');
    }

    logger.info('Test completed successfully!');
  } catch (error) {
    logger.error('Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
