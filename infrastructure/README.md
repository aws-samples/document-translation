# README

## Overview

This folder holds all the source files related to the app backend. The configuration is modelled in the Cloud Development Kit (CDK) in Typescript.

Both the CI/CD pipeline and app are defined here. They can be udpated independently for development (e.g. if working on the app, there is no need to update pipeline as well and wait for that to complete).

## Pipeline Development

### Pipeline Prerequisites

- Environment variables of configuration options for the deployment being worked on.

```shell
export translation="true"
export translationPii="true"
export translationLifecycleDefault="7"
export translationLifecyclePii="3"

export sourceGitService="code-commit"
export sourceGitRepo="document-translation"
export sourceGitBranch="dev"

export cognitoLocalUsers="true"
export cognitoLocalUsersMfa="off"

export webUi="true"

export readable="true"
export readableBedrockRegion="us-west-2"

export development="true"
export appRemovalPolicy="destroy"
export pipelineRemovalPolicy="destroy"
```

### Pipeline Commands

```sh
echo "Deployment DocTran-${sourceGitBranch}"
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
echo "Deployment DocTran-${sourceGitBranch}"
# Synthesise CDK TS to CloudFormation
cdk synth "DocTran-${sourceGitBranch}-pipeline/DocTran-appStack/DocTran-${sourceGitBranch}-app" -a 'npx ts-node ./bin/doctran.ts'
# Show a diff of changes
cdk diff "DocTran-${sourceGitBranch}-pipeline/DocTran-appStack/DocTran-${sourceGitBranch}-app" -a 'npx ts-node ./bin/doctran.ts'
# Deploy changes (performs synth & deploy)
cdk deploy "DocTran-${sourceGitBranch}-pipeline/DocTran-appStack/DocTran-${sourceGitBranch}-app" -a 'npx ts-node ./bin/doctran.ts'
```
