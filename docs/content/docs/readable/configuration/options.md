---
title: Options
weight: 4
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="info" >}}
Configuration values are stored in AWS Parameter Store. The installer script automatically creates these based on your selections.
{{< /callout >}}

## All Readable Options

Parameter values are prefix scoped to specific deployments with `/doctran/<instanceName>/`.
<br/>E.g. `/doctran/main/readable/enable` = "true"

| Option Parameter Suffix  | Example value   | Default | Required?               | Description                                  |
| ------------------------ | --------------- | ------- | ----------------------- | -------------------------------------------- |
| **Readable**             |                 |         |                         |                                              |
| `readable/enable`        | `true`, `false` | `false` | No                      | Enable simply readable features              |
| `readable/bedrockRegion` | `eu-central-1`  | NA      | **If** readable enabled | Specify the region to use for Amazon Bedrock |
