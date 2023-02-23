---
layout: default
title: PII Detection
parent: Prerequisite
grand_parent: Installation
nav_order: 4
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{: .note-title }
> Conditional
>
> This step is conditional. If you intend to use the PII detection features this step is **required**. If not this step can be skipped.

This project is able to perform PII detection on uploaded files with the use of Amazon Macie. Where PII is detected within file they are tagged `PII: True` and a separate S3 Lifecycle policy is associated with the tag. 

[Amazon Macie](https://aws.amazon.com/macie/) is a data security service that uses machine learning (ML) and pattern matching to discover and help protect your sensitive data.

AWS S3 Lifecycle policies are applied to enforce retention policies on uploaded files. All files are expired by the default default policy. This feature allows a separate configurable policy for files where PII is detected. 

If you do not wish to use this feature you can skip the below steps. 

## Enable Macie

This command ensures that Macie is enabled within the account. 

```sh
aws macie2 enable-macie
```

If you see the following error that is expected when Macie is already enabled. It is safe to continue.

> An error occurred (ConflictException) when calling the EnableMacie operation: Macie has already been enabled

## Create Macie Log Group

This command ensures that the Log Group exists if not already present. If already present the solution will use the existing Log Group. 

```sh
aws logs create-log-group --log-group-name /aws/macie/classificationjobs
```

If you see the following error that is expected when the Log Group already exists. It is safe to continue.

> An error occurred (ResourceAlreadyExistsException) when calling the CreateLogGroup operation: The specified log group already exists

![Macie Commands](/assets/img/console_cloudshell_macie.png)