---
title: Main
weight: 1
grand_parent: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

The Main StepFuction is triggered by the DynamoDB Job table stream when a new job is created. This StepFunction orchestrates the task specific StepFunctions.

![Main StepFunction Overview](/graphs/stepfunction_main_overview.png)

The Translate job is created by the Main StepFunction. Whilst it is processing the Main StepFunction is paused and waits for a callback. This callback token is stored within the DB.

When Translate completes the translation it will push the translated document into the S3 bucket. An S3 event notification triggers a Lambda function to parse the notification and start the Callback StepFunction. The responsibility of the Lambda function is to determine the job id that relates to this output document.

![Translate Workflow](/graphs/translate_workflow.png)