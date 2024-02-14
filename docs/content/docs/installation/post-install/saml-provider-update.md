---
layout: default
title: SAML Provider Update
weight: 2
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="warning" >}}
This step is **conditional**.

- If you have chosen to use SAML Provider Local Users this step is **required**.
- If not this step can be **skipped**.
{{< /callout >}}

This installation guide assumes that the user directory used for the SAML provider is Azure Active Directory. If you are  using a different provider please convert the following instructions to your particular provider.

Once installation is complete AWS CloudFormation will output the required values to update the SAML provider. 

- Navigate to the [CloudFormation Console](https://console.aws.amazon.com/cloudformation/home)
- Select the app stack (E.g. `DocTran-main-app`)
- Select the "Outputs" tab

Update the SAML provider with the outputs provided.

- Update the "Identifier (Entity ID)" with the output variable `samlIdentifier`
- Update the "Reply URL (Assertion Consumer Service URL)" with the output variable `samlReplyUrl`