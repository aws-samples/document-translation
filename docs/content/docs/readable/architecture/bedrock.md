---
title: Amazon Bedrock
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

The Simply Readable feature used [Amazon Bedrock](https://aws.amazon.com/bedrock/) for the Generative AI functionality (Simplifying text and generating images). At the time of writing Amazon Bedrock is available in select regions. Simply Readable will send the input text to the selected region for processing with the Bedrock service. As the adminstrator you are responsible selecting the approriate region for your use-case.

- If your deployment region does support Amazon Bedrock you can select it.
- If it does not you must select a supported region, or disable the feature completely.
- If you do not select a supported region the deployment will fail. 

Please review the Amazon Bedrock region for the lates[t Supported AWS Regions](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-regions.html).