# Homebridge Litter-Robot Connect

This is a [Homebridge](https://github.com/nfarina/homebridge) plugin that allows you to control your Litter-Robot 3 Connect from HomeKit.

## Features

- Control your Litter-Robot 3 Connect from HomeKit
- Monitor waste drawer level
- Control night light
- Monitor cat presence
- Monitor waste drawer status
- Reset waste drawer level gauge

## Installation

1. Install Homebridge using `npm install -g homebridge`
2. Install this plugin using `npm install -g homebridge-litter-robot-connect`
3. Update your Homebridge configuration file with your Litter-Robot credentials

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
      "hideTrayAccessory": true
    }
  ]
}
```

### Configuration Options

- `username`: Your Litter-Robot account email
- `password`: Your Litter-Robot account password
- `hideRobotAccessory`: Hide the main robot accessory (default: false)
- `hideNightlightAccessory`: Hide the nightlight accessory (default: false)
- `hideOccupancyAccessory`: Hide the occupancy sensor accessory (default: false)
- `hideTrayAccessory`: Hide the waste drawer accessory (default: true)

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

- [Homebridge](https://github.com/nfarina/homebridge) for the HomeKit integration framework
- [Litter-Robot](https://www.litter-robot.com/) for the awesome product