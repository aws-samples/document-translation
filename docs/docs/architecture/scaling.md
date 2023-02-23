---
layout: default
title: Scaling
nav_order: 5
parent: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

The architecture is designed to reduce scaling constraints where possible, such as using serverless services and an event driven workflow.

A constraint to be aware of is the "Concurrent batch translation jobs" per account for the Amazon Translate service. The default value is `10`. This application handles more than this value by queueing the jobs to be processed. Queueing increases the time for translations to complete when there is more than 10 concurrent translation jobs active.

This service quota is an [adjustable value](https://docs.aws.amazon.com/general/latest/gr/translate-service.html) and can be increased through a [quota increase request](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html).
