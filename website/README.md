# README

## Overview

This folder holds all the source files related to the app website. The site is a React based site. React has a development server for working on the website.

## Prerequisites

- Deployment of infrastructure stack for authentication and data storage
- Deployment of infrastructure stack with `development = true` which allows `localhost` websites to authenticate with Cognito
  - Or manually setting the signin/signout URLs of Cognito to allow `localhost`/`127.0.0.1`

## Commands

### Specify the infrastructure stack

```sh
export appStackName=DocTran-dev-app
```

### Configure Site Settings

```sh
# Get the CloudFormation outputs
aws cloudformation describe-stacks \
    --stack-name ${appStackName} \
    --query 'Stacks[0].Outputs' | jq .[] | jq -n 'reduce inputs as $i (null; . + ($i|{ (.OutputKey) : (.OutputValue) }))' \
        > ./src/cfnOutputs.json
# Get the AppSync ID
export awsAppsyncId=$(jq -r .awsAppsyncId ./src/cfnOutputs.json)
# Generate the GraphQL schema
aws appsync get-introspection-schema --api-id=${awsAppsyncId} --format SDL ./src/graphql/schema.graphql
# Generate the GraphQL client functions
cd ./src/graphql
npx @aws-amplify/cli@~12.0 codegen
cd ../../
# Update site settings to use local development server
sed -i 's#"https://[[:alnum:]]\+\.cloudfront\.net#"http://localhost:3000#g' ./src/cfnOutputs.json
# Enable the features
echo '{ "translation": true, "readable": true }' > ./src/features.json
```

### Start the dev server

```sh
npm run start
```
