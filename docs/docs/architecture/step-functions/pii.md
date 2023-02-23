---
layout: default
title: Main
nav_order: 1
parent: Step Functions
grand_parent: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

The Pii StepFunction job is created by the Main StepFunction. Whilst it is processing the Main StepFunction is paused and waits for a callback. This callback token is stored within the DB.

When Macie completes the detection job it will publish a log. This log is used to trigger a Lambda function to parse the log and start the Callback StepFunction. The responsibility of the Lambda function is to determine the job id that relates to this detection job.

![Macie Workflow](graphs/macie_workflow.png)