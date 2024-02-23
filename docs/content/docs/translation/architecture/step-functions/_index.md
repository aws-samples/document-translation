---
title: Step Functions
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

There are multiple StepFunctions utilised by this application.

**Translation Feature**
1. [Main]({{< ref "docs/translation/architecture/step-functions/main" >}}): Main workflow that orchestrates the other StepFunctions
2. [Translate]({{< ref "docs/translation/architecture/step-functions/translate" >}}): Manages translation jobs
3. [Callback]({{< ref "docs/translation/architecture/step-functions/callback" >}}): Retrieves Translate StepFunction callback tokens to resume tasks
4. Lifecycle: Marks the job as expire if the S3 ojects are deleted
5. [Errors]({{< ref "docs/translation/architecture/step-functions/errors" >}}): Marks the job as failed if any of the StepFunctions fail

**Translation PII Feature**
1. [PII]({{< ref "docs/translation/architecture/step-functions/pii" >}}): Manages Pii detection jobs
2. PII Callback: Retrieves Translate StepFunction callback tokens to resume tasks
3. Tag: Tags S3 objects with Pii status for Lifecycle policies

