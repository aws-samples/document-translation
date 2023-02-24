---
layout: default
title: Step Functions
nav_order: 4
parent: Architecture
has_children: true
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

There are multiple StepFunctions utilised by this application.

**Translation Feature**
1. [Main](main.md): Main workflow that orchestrates the other StepFunctions
2. [Translate](translate.md): Manages translation jobs
3. [Callback](callback.md): Retrieves Translate StepFunction callback tokens to resume tasks
4. Lifecycle: Marks the job as expire if the S3 ojects are deleted
5. [Errors](errors.md): Marks the job as failed if any of the StepFunctions fail

**Translation PII Feature**
1. [PII](pii.md): Manages Pii detection jobs
2. PII Callback: Retrieves Translate StepFunction callback tokens to resume tasks
3. Tag: Tags S3 objects with Pii status for Lifecycle policies

