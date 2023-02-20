<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

# Setup this project within CloudShell

1. Navigate to the [AWS Console](https://console.aws.amazon.com/console/home) of the solution AWS Account
2. Select the CloudShell icon from the top bar

![CloudShell Icon](../images/cloud_shell_icon.png)

For the initial deployment we must kickstart the delivery pipeline to set everything up. Once this has been completed updates can be pushed directly into the git repository without doing this step. This step tells AWS CodePipeline where our git repository is and what actions to perform with it. 

```sh
#
# Change directory into an appropriate working directory
#
# Clone the git repository
git clone https://github.com/<your-username>/<your-repo-name>.git # TODO Update with final repo
#
# Change directory into the pulled project directory
cd <your-repo-name>
#
# Ensure you're using the appropriate branch
git checkout <your-branch-name>
# 
# Change directory into the infrastructure directory
cd infrastructure
# 
# Install node packages
npm install
```