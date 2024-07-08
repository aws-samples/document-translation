---
title: Upgrading
weight: 004
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

The default deployment method links an Amazon CodeCommit repository with a delivery pipeline. Therefore, to perform an upgrade we must update the codebase in CodeCommit with the version of the project we wish to upgrade to. 

Please take care of version numbering. This project follows the [Semantic Versioning](https://semver.org/) approach. In general the versioning follows `x.y.z`. Changes to non-major version (the `y.z` part) "should" be compatible. Changes to major versions (the `z` part) is expected to require a manual upgrade conversion/action/step on your part. Please review the release information within GitHub for any particular notes.


# Simple Upgrade

The below makes assumptions. Please review the commands and update as you see fit. 

```shell
# Remove any old copies of the repo
# Be sure that you don't have any non commited alterations you need to back up first
rm -rf ./document-translation/
```

```shell
# Instruct Git to use AWS CLI for authentication
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
# Clone your copy of the project from CodeCommit
# Check repo name matches your repo you chose at deployment
git clone https://git-codecommit.eu-west-2.amazonaws.com/v1/repos/document-translation
cd document-translation/
# Add the upstream GitHub project to git with the name upstream
git remote add upstream https://github.com/aws-samples/document-translation.git
# Fetch the latest changes from upstream
git fetch upstream
# Show the available tags ordered numerically
git tag
# Checkout the version you wish to use
# Check the output fof the available version tags
git checkout tags/v2.3.0 -b v2.3.0
git checkout main
# Merge the latest changes from upstream into your current branch
git merge v2.3.0
# Push the merged changes to your CodeCommit
git push origin
```

# CloudShell Reset

If you get stuck with space or strange issues this can be caused by stale files/state within CloudShell. Resetting the CloudShell will remove any files saved there, so please download/backup anything you need before doing so. 

1. Navigate to CloudShell within the AWS account where the project is deployed. 
2. "Actions" > "Delete AWS CloudShell home directory"