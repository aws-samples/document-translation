<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

#  Deploy

```sh
# Create a CodeCommit repository
aws codecommit create-repository --repository-name ${sourceGitRepo}
# Deploy
cdk bootstrap
cdk deploy
```
