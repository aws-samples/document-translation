---
layout: default
title: Errors
nav_order: 1
parent: Step Functions
grand_parent: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

If there is a failure of StepFunctions for a particular job then the Errors StepFunction will execute. This is triggered by an EventBridge notification using the default AWS bus. The responsibility of the StepFunction is to present non successful states back to the user.

![Macie Workflow]({{ site.baseurl }}/assets/graphs/stepfunction_errors.png)