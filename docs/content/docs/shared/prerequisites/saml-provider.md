---
title: SAML Provider
weight: 6
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="warning" >}}
This step is **conditional**.

- If you intend to use a SAML Provider for user authentication this step is **required**.
- If not this step can be **skipped**.
{{< /callout >}}

To integrate this solution with your existing user accounts it is integrated via SAML 2.0. This is supported by most user management systems, such as Azure Active Directory. A metadata URL is provided by the SAML provider and used by this solution. Configuration of any specific SAML Provider is out of scope for this installation guide. This URL looks like this:

```
https://login.microsoftonline.com/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy/federationmetadata/2007-06/federationmetadata.xml?appid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

This installation guide assumes that the user directory used for the SAML provider is Azure Active Directory. Configuration of Azure AD is out of scope for this installation guide.

Where an Enterprise Application needs to be created, dummy information can be used for the following, updated as a post-install step.

- `Identifier (Entity ID)`
- `Reply URL (Assertion Consumer Service URL)`

The `App Federation Metadata Url` is a dependency for this guide.

# Post-Install

The use of a SAML Provider has a [post-install step]({{< ref "docs/shared/post-install/saml-provider" >}}). 