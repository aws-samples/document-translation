---
title: Deploy
weight: 4
parent: Installation
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="error" >}}
This step is **required**.
{{< /callout >}}

{{< callout type="info" >}}
It is important that the below command are run in the same shell session as the configuration options step. 
{{< /callout >}}

Using the terminal (E.g. [CloudShell]({{< ref "cloudshell" >}})) perform the following commands. 

## Bootstrap the account

```sh
# Bootstrap the account for use with the AWS CDK
# Update the <ACCOUNT-ID> with your account ID (shown top right of the AWS Console)
cdk bootstrap aws://<ACCOUNT-ID>/${AWS_REGION}
```

## Clone source code

```sh
# Clone the upstream project git repository
git clone https://github.com/aws-samples/document-translation.git
#
# Change directory into the pulled project directory
cd document-translation
# 
# If desired checkout a particular version, see https://semver.org/
# Fetch available tags
git fetch --all --tags
# View tags
git tag
# Checkout tag
git checkout tags/v1.0.1
```

## Push source code to your CodeCommit
```sh
# Enable the AWS CLI git credentials helper
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
# 
# Add CodeCommit as a remote
# git remote add codecommit https://git-codecommit.<REGION>.amazonaws.com/v1/repos/<REPO-NAME>
git remote add codecommit https://git-codecommit.${AWS_REGION}.amazonaws.com/v1/repos/${sourceGitRepo}
# 
# Push files
# git push <REMOTE-NAME> <BRANCH-NAME>
git push codecommit main
```

## Deploy the pipeline

This project uses a delivery pipeline for deploying the application. This step deploys the pipeline itself. The pipeline will pull the source code from the source repository to deploy the application. The [CloudFormation Console](https://console.aws.amazon.com/cloudformation/home) and [CodePipelines Console](https://console.aws.amazon.com/codesuite/codepipeline/home) can be used to track the progress.

```sh
#
# Change directory into the infrastructure directory
cd infrastructure
# 
# Install node dependencies
npm install
# 
# Deploy
cdk deploy
# Review the changes to be made and accept with 'y' if appropriate
```