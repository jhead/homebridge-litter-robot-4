# Litter Robot 4 API Documentation

## Introduction

Most information documented here was extracted from the Whisker iOS app on the Apple App Store or intercepted via mitmproxy. The app appears to be Flutter/Dart-based and uses AWS Amplify.

## Authentication

The API uses AWS Cognito for authentication. The authentication flow is straightforward:

1. Authenticate with username/password via Cognito USER_PASSWORD_AUTH flow
2. Use the returned ID token in subsequent API requests

## API Endpoints

`https://lr4.iothings.site/graphql`

## GraphQL Mutations

### Robot Control Commands

#### Send Command

```graphql
mutation SendLR4Command(
  $serial: String!
  $command: String!
  $value: String
  $commandSource: String
) {
  sendLitterRobot4Command(
    input: { serial: $serial, command: $command, value: $value, commandSource: $commandSource }
  )
}
```

#### Toggle Hopper

```graphql
mutation ToggleHopper($serial: String!, $isRemoved: Boolean!) {
  toggleHopper(serial: $serial, isRemoved: $isRemoved) {
    success
  }
}
```

#### Reset Scoops Counter

```graphql
mutation ResetScoopsSavedCounter($serial: String!) {
  resetScoopsSavedCounter(serial: $serial) {
    userId
    robotCount
    robots {
      unitId
      name
      serial
      userId
      espFirmware
      picFirmwareVersion
      picFirmwareVersionHex
      laserBoardFirmwareVersion
      laserBoardFirmwareVersionHex
      wifiRssi
      unitPowerType
      catWeight
      unitTimezone
      unitTime
      cleanCycleWaitTime
      isKeypadLockout
      nightLightMode
      nightLightBrightness
      isPanelSleepMode
      panelBrightnessHigh
      panelBrightnessLow
      smartWeightEnabled
      panelSleepTime
      panelWakeTime
      displayCode
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
      litterLevelPercentage
      litterLevelState
      unitPowerStatus
      sleepStatus
      robotStatus
      globeMotorFaultStatus
      pinchStatus
      catDetect
      isBonnetRemoved
      isNightLightLEDOn
      odometerPowerCycles
      odometerCleanCycles
      odometerEmptyCycles
      odometerFilterCycles
      isDFIResetPending
      DFINumberOfCycles
      DFILevelPercent
      isDFIFull
      DFIFullCounter
      DFITriggerCount
      litterLevel
      DFILevelMM
      isCatDetectPending
      globeMotorRetractFaultStatus
      robotCycleStatus
      robotCycleState
      weightSensor
      isOnline
      isOnboarded
      isProvisioned
      isDebugModeActive
      lastSeen
      sessionId
      setupDateTime
      isFirmwareUpdateTriggered
      firmwareUpdateStatus
      wifiModeStatus
      isUSBPowerOn
      USBFaultStatus
      isDFIPartialFull
      isLaserDirty
      hopperStatus
      scoopsSavedCount
      isHopperRemoved
    }
  }
}
```

### Robot Management

#### Register Robot

```graphql
mutation RegisterLR4($value: LR4RegisterRobotInput!) {
  registerLitterRobot4(input: $value) {
    body
    statusCode
  }
}
```

#### Update Robot State

```graphql
mutation LitterRobot4StateUpdate($value: LR4UpdateLitterRobotInput!) {
  updateLitterRobot4(input: $value) {
    surfaceType
  }
}
```

#### Update Robot Name

```graphql
mutation UpdateLR4Name($serial: String!, $name: String!) {
  updateLitterRobot4(input: { serial: $serial, name: $name }) {
    name
  }
}
```

#### Delete Robot

```graphql
mutation DeleteLR4($serial: String!) {
  deleteLitterRobot4(input: { serial: $serial }) {
    body
    statusCode
  }
}
```

#### Trigger Firmware Update

```graphql
mutation TriggerUpdateBySerial($serialNumber: String!) {
  triggerRobotUpdateBySerial(serialNumber: $serialNumber) {
    success
    message
    serialNumber
  }
}
```

#### Sync Robot State

```graphql
mutation LitterRobot4MultiStateSync($userId: String!) {
  litterRobot4MultiStateSync(input: { userId: $userId })
}
```

### User Settings

#### Update User Settings

```graphql
mutation UpdateUserSettings($value: UpdateUserSettingsInput!) {
  updateUserSettings(input: $value) {
    user {
      useMetric
      settings {
        LR4Notifications {
          all_notifications
          CCC_notifications
          CSI_notifications
          DFI_notifications
          fault_notifications
          CSF_notifications
          PD_notifications
          OTF_notifications
          DHF_notifications
          BR_notifications
          MTF_notifications
          MID_notifications
          general_notifications
          offline_notifications
          LF_notifications
          LL_notifications
          HPE_notifications
        }
        LR3Notifications {
          BR_notifications
          CCC_notifications
          CSF_notifications
          CSI_notifications
          DFI_notifications
          DHF_notifications
          OTF_notifications
          PD_notifications
          all_notifications
          fault_notifications
          general_notifications
          offline_notifications
        }
        FR1Notifications {
          chuteFullExt
          defectiveSensor
          dispenseFailed
          levelLow
          mealDispensed
          motorFault
          snackDispensed
          snackRejected
          all
        }
      }
    }
    statusCode
    body
  }
}
```

#### Update User Settings V2

```graphql
mutation UpdateUserSettingsV2($value: UpdateUserSettingsV2Input!) {
  updateUserSettingsV2(input: $value) {
    user {
      settingsV2 {
        LR4Notifications {
          allRobotUsage
          drawerFull
          lowLitter
          petInactivity
          cleanCycleComplete
          cleanCycleInterrupted
          catDetectedInDrawer
          hopperEnabled
          firmwareUpdateSuccessful
          allErrors
        }
        LR3Notifications {
          allRobotUsage
          drawerFull
          cleanCycleComplete
          cleanCycleInterrupted
          allErrors
        }
        FR1Notifications {
          allRobotUsage
          mealDispensed
          snackDispensed
          levelLow
          allErrors
        }
      }
    }
    statusCode
    body
  }
}
```

#### Set User Functional Settings

```graphql
mutation SetUserFunctionalSettings($userId: String, $autoUpdateFeature: FeatureFlagOptions) {
  setUserFunctionalSettings(
    userFunctionalSettingsInput: { userId: $userId, autoUpdateFeature: $autoUpdateFeature }
  ) {
    autoUpdateFeature
    userId
  }
}
```

### User Management

#### Create User

```graphql
mutation CreateUser(
  $email: AWSEmail!
  $firstName: String!
  $lastName: String!
  $password: String!
  $extensionAttributes: ExtensionAttributes
) {
  createUser(
    input: {
      email: $email
      firstName: $firstName
      lastName: $lastName
      password: $password
      extensionAttributes: $extensionAttributes
    }
  ) {
    id
    firstName
    lastName
    email
  }
}
```

#### Update User

```graphql
mutation UpdateUser($id: ID!, $email: AWSEmail!, $firstName: String!, $lastName: String!) {
  updateUser(input: { id: $id, email: $email, firstName: $firstName, lastName: $lastName }) {
    id
    firstName
    lastName
    email
  }
}
```

#### Add User

```graphql
mutation AddUser($value: AddUserInput!) {
  addUser(input: $value) {
    user {
      userId
    }
  }
}
```

### Pet Management

#### Add Pet

```graphql
mutation AddPet($value: AddPetInput!) {
  addPet(input: $value) {
    petId
    s3ImageURL
  }
}
```

#### Update Pet

```graphql
mutation UpdatePet($value: UpdatePetInput!) {
  updatePet(input: $value) {
    petId
  }
}
```

#### Delete Pet

```graphql
mutation DeletePet($petId: String!) {
  deletePet(input: { petId: $petId })
}
```

### Subscription Management

#### Activate W+ Subscription

```graphql
mutation ActivateWPlusSubscription($input: ActivateWPlusSubscriptionInput!) {
  activateWPlusSubscription(input: $input) {
    success
    result_code
    message
  }
}
```

## App Configuration

```json
{
  "UserAgent": "aws-amplify-cli/2.0",
  "Version": "1.0",
  "auth": {
    "plugins": {
      "awsCognitoAuthPlugin": {
        "CognitoUserPool": {
          "Default": {
            "PoolId": "us-east-1_rjhNnZVAm",
            "AppClientId": "4552ujeu3aic90nf8qn53levmn",
            "Region": "us-east-1"
          }
        },
        "Auth": {
          "Default": {
            "authenticationFlowType": "USER_PASSWORD_AUTH"
          }
        }
      }
    }
  },
  "api": {
    "plugins": {
      "awsAPIPlugin": {
        "LR4-appsync-robots": {
          "endpointType": "GraphQL",
          "endpoint": "https://lr4.iothings.site/graphql",
          "region": "us-east-1",
          "authorizationType": "AWS_LAMBDA"
        },
        "notifications-appsync-users": {
          "endpointType": "GraphQL",
          "endpoint": "https://notifications.iothings.site/graphql",
          "region": "us-east-1",
          "authorizationType": "AWS_LAMBDA"
        },
        "popup-messaging-service-api": {
          "endpointType": "GraphQL",
          "endpoint": "https://scjk7s4xlng3ledgl5gtiobbbe.appsync-api.us-east-1.amazonaws.com/graphql",
          "region": "us-east-1",
          "authorizationType": "AMAZON_COGNITO_USER_POOLS"
        },
        "PetProfile-prod-Api": {
          "endpointType": "GraphQL",
          "endpoint": "https://pet-profile.iothings.site/graphql",
          "region": "us-east-1",
          "authorizationType": "AWS_LAMBDA"
        },
        "ota-service-appsync-api": {
          "endpointType": "GraphQL",
          "endpoint": "https://otaupdate.prod.iothings.site/graphql",
          "region": "us-east-1",
          "authorizationType": "AWS_LAMBDA"
        },
        "account-management-service-prod-api": {
          "endpointType": "GraphQL",
          "endpoint": "https://account-mgmt.iothings.site/graphql",
          "region": "us-east-1",
          "authorizationType": "AMAZON_COGNITO_USER_POOLS"
        },
        "account-management-service-prod-apiKey": {
          "endpointType": "GraphQL",
          "endpoint": "https://account-mgmt.iothings.site/graphql",
          "region": "us-east-1",
          "authorizationType": "API_KEY",
          "apiKey": "da2-5ru2q54lnffpdiq6ihw4lno6si"
        },
        "pet-insights": {
          "endpointType": "GraphQL",
          "endpoint": "https://insight-engine.prod.iothings.site/graphql",
          "region": "us-east-1",
          "authorizationType": "AMAZON_COGNITO_USER_POOLS"
        }
      }
    }
  }
}
```
