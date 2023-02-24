---
layout: default
title: Options
parent: Configuration
grand_parent: Installation
nav_order: 1
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{: .note-title }
> Required
>
> This step is required. Many options below are required whilst others are optional.

> {: .note-title }
> Important
>
> It is important that the below options are defined in the same shell session as the deploy step. 

This solution is configurable to meet your specific needs. In this step you will specify which features you want enabled or disabled. To configure an option use the terminal (E.g. [CloudShell]({{ site.baseurl }}/docs/installation/prerequisite/cloudshell.md)) to perform the relevant commands.

<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

## Source Code Branch

The git source repository information is a **required** configuration. 

```sh
export sourceGitBranch="main"
```

## User Authentication

This solution supports two sources of user authentication. These can be enabled individually or together.

1. AWS Cognito Local Users
  - Recommended for testing
  - Users are managed within the AWS Account
  - Users are not linked to existing user directories
  - Configurable MFA settings
1. AWS Cognito SAML Users
  - Recommended for production usage 
  - Users are managed by a SAML provider
  - Users are linked to existing user directories
  - Configuration of SAML provider is out of scope for this installation guide

### Enable Cognito Local Users

```sh
export cognitoLocalUsers="true"
export cognitoLocalUsersMfa="required"
export cognitoLocalUsersMfaOtp="true"
export cognitoLocalUsersMfaSms="true"
```

### Enable Cognito SAML Provider Users

To integrate this solution with your existing user accounts it is integrated via SAML 2.0. This is supported by most user management systems, such as Azure Active Directory. A metadata URL is provided by the SAML provider and used by this solution. This URL looks like this `https://login.microsoftonline.com/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy/federationmetadata/2007-06/federationmetadata.xml?appid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. Configuration of Azure AD is out of scope for this installation guide. 

This installation guide assumes that the user directory used for the SAML provider is Azure Active Directory. Configuration of Azure AD is out of scope for this installation guide. An Enterprise Application will need to be created. Dummy information can be used for the "Identifier (Entity ID)" and "Reply URL (Assertion Consumer Service URL)" to be updated later in this guide. The "App Federation Metadata Url" is a dependency for this guide.

```sh
export cognitoSamlUsers="true"
export cognitoSamlMetadataUrl="https://domain.tld/path/to/metadata.xml"
```

## Enable Web UI

This solution ships with a Web UI which is can be simply customised to fit your branding. Where integration with existing systems or much larger customisation is desired, the solution can be deployed without the web UI and provide just an API to integrate with. 

```sh
export webUi="true"
```

## Translation & Translation PII

### Enable Translation

Today this solution supports translation as its main purpose. To allow for flexibility in the future translation is a modular component which can be enabled/disabled. 

```sh
export translation="true"
export translationLifecycleDefault="7"
```

### Enable Translation Pii Detection

Pii detection in uploaded files is supported by the translation feature. The result of this allows for more strict lifecycle policies to be applied than the default where Pii is detected. E.g. this allows files with Pii detected to be deleted in 3 days, whilst files where no Pii is detected to be retained longer such as 7 days. These values are configurable.

```sh
export translationPii="true"
export translationLifecyclePii="3"
```

## All Options

| Option                        | Example value                     | Default  | Required?                         | Description                                     |
| ----------------------------- | --------------------------------- | -------- | --------------------------------- | ----------------------------------------------- |
| **Removal Policies**          |                                   |          |                                   |                                                 |
| `appRemovalPolicy`            | `destroy`, `snapshot`, `retain`   | `retain` | Not required                      | Removal policy for deployed app components      |
| `pipelineRemovalPolicy`       | `destroy`, `snapshot`, `retain`   | `retain` | Not required                      | Removal policy for deployed pipeline components |
| **Users - Cognito Local**     |                                   |          |                                   |                                                 |
| `cognitoLocalUsers`           | `true`, `false`                   | `false`  | Yes, **if not** using SAML users  | Enable locally managed users                    |
| `cognitoLocalUsersMfa`        | `required`, `optional`, `off`     | `off`    | Not required                      | Enable MFA for locally managed users            |
| `cognitoLocalUsersMfaOtp`     | `true`, `false`                   | `false`  | Not required                      | Enable OTP MFA for locally managed users        |
| `cognitoLocalUsersMfaSms`     | `true`, `false`                   | `false`  | Not required                      | Enable SMS MFA for locally managed users        |
| **Users - SAML Provider**     |                                   |          |                                   |                                                 |
| `cognitoSamlUsers`            | `true`, `false`                   | `false`  | Yes, **if not** using local users | Enable SAML managed users                       |
| `cognitoSamlMetadataUrl`      | "https://domain.tld/metadata.xml" | None     | Yes, **if** using SAML users      | Metadata XML from the SAML provider             |
| **Git Source**                |                                   |          |                                   |                                                 |
| `sourceGitRepo`               | "<owner>/<repo>"                  | None     | Yes, **always** required          | Your repository for source code                 |
| `sourceGitBranch`             | "main", "test", "app"             | `main`   | Not required                      | Your repository branch for source code          |
| **Feature - Translation**     |                                   |          |                                   |                                                 |
| `translation`                 | `true`, `false`                   | `false`  | Not required                      | Enable document translation                     |
| `translationLifecycleDefault` | `5`                               | `7`      | Not required                      | Specify S3 lifecycle policy in days             |
| **Feature - Translation PII** |                                   |          |                                   |                                                 |
| `translationPii`              | `true`, `false`                   | `false`  | Not required                      | Enable PII detection within document contents   |
| `translationLifecyclePii`     | `5`                               | `3`      | Not required                      | Specify S3 lifecycle policy in days             |
| **Web UI**                    |                                   |          |                                   |                                                 |
| `webUi`                       | `true`, `false`                   | `false`  | Not required                      | Enable web UI for using this solution           |