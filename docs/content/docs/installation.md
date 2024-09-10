---
title: Installation
weight: 003
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="info" >}}
Installation typically takes between 30-60 minutes.
{{< /callout >}}

## Prerequisite

A [GitHub Token]({{< ref "docs/shared/prerequisites/github-token" >}}) is required for this app.

## Install

From the [AWS CloudShell]({{< ref "docs/shared/prerequisites/cloudshell" >}}) run the install script.

```sh
# Download the install script
wget https://raw.githubusercontent.com/aws-samples/document-translation/main/util/installer/install.sh

# Make the script executable
chmod +x ./install.sh

# Run the install script
./install.sh
```
