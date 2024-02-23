---
title: Deploy
weight: 102
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->


{{< callout type="warning" >}}
It is highly recommended to use the [Quick Start]({{< ref "installation" >}}) wizard for installation with [CloudShell]({{< ref "docs/shared/prerequisites/cloudshell" >}}).
{{< /callout >}}

This project can be deployed in multiple ways to fit your needs. The recommended approach is documented and highlighted in this installation guide. The recommend method is to utilise AWS CloudShell for the CLI commands and AWS CodeCommit for the git repository. However, this project will also work with your local CLI and GitHub as the git repository. If choosing not to follow the recommended method you are expected to understand how to convert any changes needed for your particular setup. 

[AWS CloudShell](https://aws.amazon.com/cloudshell/) is a browser-based shell which provides you with many of the tools and permissions to complete the installation without needing to install and configure additional software or have CLI access to your local machine. 

[AWS CodeCommit](https://aws.amazon.com/codecommit/) is a secure, highly scalable, fully managed source control service that hosts private Git repositories.

{{< callout type="error" >}}
This step is **required**.
{{< /callout >}}

{{< callout type="info" >}}
It is important that the below command are run in the same shell session as the configuration options step. 
{{< /callout >}}

Using the terminal (E.g. [CloudShell]({{< ref "docs/shared/prerequisites/cloudshell.md" >}})) perform the following commands. 

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