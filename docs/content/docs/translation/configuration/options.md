---
title: Options
weight: 4
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="error" >}}
This step is **required**. Many options below are required whilst others are optional.
{{< /callout >}}

{{< callout type="info" >}}
It is important that the below options are defined in the same shell session as the deploy step.
{{< /callout >}}

This solution is configurable to meet your specific needs. In this step you will specify which features you want enabled or disabled. To configure an option use the terminal (E.g. [CloudShell]({{< ref "docs/shared/prerequisites/cloudshell" >}})) to perform the relevant commands.


## Enable Translation

Today this solution supports translation as its main purpose. To allow for flexibility in the future translation is a modular component which can be enabled/disabled. 

```sh
export translation="true"
export translationLifecycleDefault="7"
```

## Enable Translation Pii Detection

Pii detection in uploaded files is supported by the translation feature. The result of this allows for more strict lifecycle policies to be applied than the default where Pii is detected. E.g. this allows files with Pii detected to be deleted in 3 days, whilst files where no Pii is detected to be retained longer such as 7 days. These values are configurable.

```sh
export translationPii="true"
export translationLifecyclePii="3"
```

## All Options

| Option                        | Example value                     | Default  | Required?                         | Description                                     |
| ----------------------------- | --------------------------------- | -------- | --------------------------------- | ----------------------------------------------- |
| **Feature - Translation**     |                                   |          |                                   |                                                 |
| `translation`                 | `true`, `false`                   | `false`  | Not required                      | Enable document translation                     |
| `translationLifecycleDefault` | `5`                               | `7`      | Not required                      | Specify S3 lifecycle policy in days             |
| **Feature - Translation PII** |                                   |          |                                   |                                                 |
| `translationPii`              | `true`, `false`                   | `false`  | Not required                      | Enable PII detection within document contents   |
| `translationLifecyclePii`     | `5`                               | `3`      | Not required                      | Specify S3 lifecycle policy in days             |
