# README

## Overview

This folder holds all the source files related to the app backend. The configuration is modelled in the Cloud Development Kit (CDK) in Typescript.

Both the CI/CD pipeline and app are defined here. They can be udpated independently for development (e.g. if working on the app, there is no need to update pipeline as well and wait for that to complete).

## Pipeline Development

### Pipeline Prerequisites

- Environment variables of configuration options for the deployment being worked on.

```shell
export common_instance_name="main"
export pipeline_source_repoOwner="aws-samples"
export pipeline_source_repoName="document-translation"
export pipeline_source_repoBranch="release/test"
export pipeline_source_repoHookEnable="false"
export pipeline_source_repoPeriodicChecksEnable="true"
export pipeline_source_repoTokenName="doctran-main-oauth-token-1724924907"
export pipeline_approvals_preCdkSynth_enable="false"
export app_cognito_localUsers_enable="true"
export app_cognito_saml_enable="false"
export app_cognito_localUsers_mfa_enforcement="OFF"
export app_cognito_localUsers_mfa_otp="false"
export app_cognito_localUsers_mfa_sms="false"
export app_webUi_enable="true"
export app_webUi_customDomain_enable="false"
export app_translation_enable="true"
export app_translation_lifecycle="7"
export app_translation_pii_enable="true"
export app_translation_pii_lifecycle="7"
export app_readable_enable="true"
export app_readable_bedrockRegion="eu-west-2"
export common_development_enable="true"
export app_removalPolicy="DELETE"
export pipeline_removalPolicy="DELETE"
```

### Pipeline Commands

```sh
echo "Deployment DocTran-${instanceName}"
# Synthesise CDK TS to CloudFormation
cdk synth
# Show a diff of changes
cdk diff
# Deploy changes (performs synth & deploy)
cdk deploy
```

## App Development

The app template is a child of the pipeline template. With CDK we can target the specific child template we want to manipulate so that we can focus our efforts on that specifically. This will deploy app changes directly to CloudFormation without going via Git/CodePipeline. However, this will create a diff between what is in Git/CodePipeline and what is in CloudFormation. So only use this for development/testing of changes which are not yet ready to be committed.

### App Prerequisites

- A deployed app backend

### App Commands

```sh
echo "Deployment DocTran-${instanceName}"
# Synthesise CDK TS to CloudFormation
cdk synth "DocTran-${instanceName}-pipeline/DocTran-appStack/DocTran-${instanceName}-app" -a 'npx ts-node ./bin/doctran.ts'
# Show a diff of changes
cdk diff "DocTran-${instanceName}-pipeline/DocTran-appStack/DocTran-${instanceName}-app" -a 'npx ts-node ./bin/doctran.ts'
# Deploy changes (performs synth & deploy)
cdk deploy "DocTran-${instanceName}-pipeline/DocTran-appStack/DocTran-${instanceName}-app" -a 'npx ts-node ./bin/doctran.ts'
```
