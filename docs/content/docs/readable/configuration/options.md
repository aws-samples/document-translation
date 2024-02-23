---
title: Options
weight: 4
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

## Enable Simply Readable

```sh
export readable="true"
export readableBedrockRegion="<your-chosen-region-code>" # E.g. "eu-central-1" for Franfurt
```

## All Options

| Option                        | Example value   | Default | Required?                    | Description                                  |
| ----------------------------- | --------------- | ------- | ---------------------------- | -------------------------------------------- |
| `readable`                    | `true`, `false` | `false` | Not required                 | Enable simply readable                       |
| `readableBedrockRegion`       | `eu-central-1`  | None    | Required if readable is true | Specify the region to use for Amazon Bedrock |
