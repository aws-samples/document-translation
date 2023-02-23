---
layout: default
title: Step Functions
nav_order: 4
parent: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

There are multiple StepFunctions utilised by this application.

**Translation Feature**
1. [Main](#step-function-main): Main workflow that orchestrates the other StepFunctions
2. [Translate](#step-function-translate): Manages translation jobs
3. [Callback](#step-function-callback): Retrieves Translate StepFunction callback tokens to resume tasks
4. [Lifecycle](#step-function-lifecycle): Marks the job as expire if the S3 ojects are deleted
5. [Errors](#step-function-errors): Marks the job as failed if any of the StepFunctions fail

**Translation PII Feature**
1. [PII](#step-function-pii): Manages Pii detection jobs
1. [Pii Callback](#step-function-pii-callback): Retrieves Pii StepFunction callback tokens to resume tasks
2. [Tag](#step-function-translate): Tags S3 objects with Pii status for Lifecycle policies

