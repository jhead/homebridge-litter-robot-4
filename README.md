# Homebridge Litter Robot 4

This is a [Homebridge](https://github.com/homebridge/homebridge) plugin that allows you to control your Litter Robot 4 from HomeKit.

Forked from [ryanleesmith/homebridge-litter-robot-connect](https://github.com/ryanleesmith/homebridge-litter-robot-connect) and updated for Whisker's current GraphQL APIs for Litter Robot 4.

## Features

- Control your Litter-Robot 4 from HomeKit
- Monitor waste drawer level
- Control night light
- Monitor cat presence
- Monitor waste drawer status
- Reset waste drawer level gauge
- Monitor cat weight

## Installation

1. Install Homebridge using `npm install -g homebridge`
2. Install this plugin using `npm install -g @jhead/homebridge-litter-robot-4`
3. Update your Homebridge configuration file with your Whisker app credentials

## Configuration

Add the following to your Homebridge config.json:

```json
{
  "platforms": [
    {
      "platform": "LitterRobotPlatform",
      "username": "your-email@example.com",
      "password": "your-password",
      "hideRobotAccessory": false,
      "hideNightlightAccessory": false,
      "hideOccupancyAccessory": false,
      "hideTrayAccessory": true,
      "pollingFrequency": 300
    }
  ]
}
```

### Configuration Options

- `username`: Your Litter-Robot account email (required)
- `password`: Your Litter-Robot account password (required)
- `hideRobotAccessory`: Hide the main robot accessory which provides general control and status updates (default: false)
- `hideNightlightAccessory`: Hide the accessory which allows you to turn on and off the nightlight (default: false)
- `hideOccupancyAccessory`: Hide the accessory which indicates your pet entered the Litter-Robot (default: false)
- `hideTrayAccessory`: Hide the accessory which indicates your Litter-Robot tray is full (default: true)
- `pollingFrequency`: How frequently (in seconds) the platform will poll the Litter-Robot API for current status (default: 300)

## Development

This plugin is written in TypeScript and uses modern Node.js features. To contribute:

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`
5. Lint the code: `npm run lint`
6. Format the code: `npm run format`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [ryanleesmith/homebridge-litter-robot-connect](https://github.com/ryanleesmith/homebridge-litter-robot-connect) for the original implementation for Litter Robot 3 Connect
- [Homebridge](https://github.com/nfarina/homebridge) for the HomeKit integration framework
- [Litter-Robot](https://www.litter-robot.com/) for the awesome product
