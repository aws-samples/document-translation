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

The Callback StepFuction is triggered by completion of the Translate job. This StepFunction instructs the paused Transation StepFunction to continue for a particular job ID.