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

## All Translation Options

Parameter values are prefix scoped to specific deployments with `/doctran/<instanceName>/`.
<br/>E.g. `/doctran/main/translation/enable` = "true"

| Option Parameter Suffix         | Example value   | Default | Required? | Description                                                      |
| ------------------------------- | --------------- | ------- | --------- | ---------------------------------------------------------------- |
| **Translation**                 |                 |         |           |                                                                  |
| translation/enable              | `true`, `false` | `false` | No        | Enable translation features                                      |
| translation/lifecycle           | `7`, `30`, `90` | `7`     | No        | Days to retain files uploaded & translated                       |
| **Translation - PII Detection** |                 |         |           |                                                                  |
| translation/pii/enable          | `true`, `false` | `false` | No        | Enable translation features                                      |
| translation/pii/lifecycle       | `7`, `30`, `90` | `3`     | No        | Days to retain files uploaded & translated where PII is detected |
