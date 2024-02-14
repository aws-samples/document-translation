---
layout: default
title: Cognito First User
weight: 1
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="warning" >}}
This step is **conditional**.

- If you have chosen to use Cognito Local Users this step is **required**. 
- If not this step can be **skipped**.
{{< /callout >}}

[Amazon Cognito](https://aws.amazon.com/cognito/) provides an identity store that scales to millions of users and offers advanced security features to protect your consumers and business. 

- Navigate to the [AWS Cognito Console](https://console.aws.amazon.com/cognito/v2/home)
- Select the appropriate "User pool name"
- Select "Create user" in the "Users" section on the "Users" tab
- Complete the form as appropriate
  - Note: If you specify a password it will be emailed to the user email in plain text.
- Select "Create user"