# Litter Robot 4 API Documentation

## Introduction

Most information documented here was extracted from the Whisker iOS app on the Apple App Store or intercepted via mitmproxy. The app appears to be Flutter/Dart-based and uses AWS Amplify.

## Authentication

The API uses AWS Cognito for authentication. The authentication flow is straightforward:

1. Authenticate with username/password via Cognito USER_PASSWORD_AUTH flow
2. Use the returned ID token in subsequent API requests

## API Endpoints

`https://lr4.iothings.site/graphql`

## GraphQL Schema

[schema.graphql](schema.graphql)

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
