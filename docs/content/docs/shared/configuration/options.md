---
title: Options
weight: 4
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="info" >}}
Configuration values are stored in AWS Parameter Store. The installer script automatically creates these based on your selections.
{{< /callout >}}

## All Shared Options

Parameter values are prefix scoped to specific deployments with `/doctran/<instanceName>/`.
<br/>E.g. `/doctran/main/common/instance/name` = "main"

| Option Parameter Suffix                | Example value                     | Default                      | Required?                    | Description                                                            |
| -------------------------------------- | --------------------------------- | ---------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| **Common**                             |                                   |                              |                              |                                                                        |
| common/instance/name                   | `main`, `test`, `foo`             | `main`                       | **Yes**                      | Account unique name for this deployment                                |
| common/development/enable              | `true`, `false`                   | `false`                      | No                           | Enable development features. Only use in test/dev environments         |
| **Pipeline**                           |                                   |                              |                              |                                                                        |
| **Pipeline - Source**                  |                                   |                              |                              |                                                                        |
| pipeline/source/repoBranch             | `release/test`                    | NA                           | **Yes**                      | Upstream branch to track for updates                                   |
| pipeline/source/repoOwner              | `aws-samples`                     | `aws-samples`                | No                           | Upstream repo owner to track for updates                               |
| pipeline/source/repoName               | `document-translation`            | `document-translation`       | No                           | Upstream repo name to track for updates                                |
| pipeline/source/repoHook/enable        | `true`, `false`                   | `false`. `true` if permitted | No                           | Integrate with GitHub via repo hook. Requires GitHub Token permissions |
| **Pipeline - Misc**                    |                                   |                              |                              |                                                                        |
| pipeline/removalPolicy                 | `destroy`, `snapshot`, `retain`   | `retain`                     | No                           | Removal policy for deployed pipeline components                        |
| **Pipeline - Approvals**               |                                   |                              |                              |                                                                        |
| pipeline/approvals/preCdkSynth/enable  | `true`, `false`                   | `true`                       | No                           | Require manual approval before CDK Synth can run in the pipeline       |
| pipeline/approvals/preCdkSynth/email   | `foo@example.com`                 | NA                           | **If** using approval        | Target email for manual approval                                       |
| **App**                                |                                   |                              |                              |                                                                        |
| **App - Misc**                         |                                   |                              |                              |                                                                        |
| app/removalPolicy                      | `destroy`, `snapshot`, `retain`   | `retain`                     | No                           | Removal policy for deployed app components                             |
| **App - Cognito - Local**              |                                   |                              |                              |                                                                        |
| app/cognito/localUsers/enable          | `true`, `false`                   | `false`                      | **If not** using SAML users  | Enable locally managed users                                           |
| app/cognito/localUsers/mfa/enforcement | `required`, `optional`, `off`     | `off`                        | No                           | Enable MFA for locally managed users                                   |
| app/cognito/localUsers/mfa/otp         | `true`, `false`                   | `false`                      | No                           | Enable OTP MFA for locally managed users                               |
| app/cognito/localUsers/mfa/sms         | `true`, `false`                   | `false`                      | No                           | Enable SMS MFA for locally managed users                               |
| **App - Cognito - SAML**               |                                   |                              |                              |                                                                        |
| app/cognito/saml/enable                | `true`, `false`                   | `false`                      | **If not** using local users | Enable SAML managed users                                              |
| app/cognito/saml/metadataUrl           | `https://domain.tld/metadata.xml` | NA                           | **If** using SAML users      | Metadata XML from the SAML provider                                    |
| **App - WebUI**                        |                                   |                              |                              |                                                                        |
| app/webUi/enable                       | `true`, `false`                   | `false`                      | No                           | Enable web UI for using this solution                                  |
| app/webUi/customDomain/enable          | `true`, `false`                   | `false`                      |                              | Enable custom domain name for the web UI                               |
| app/webUi/customDomain/certificateArn  | `arn:aws:acm:us-east-1:....`      | NA                           | **If** using custom domain   | ACM Certificate ARN for the custom domain name                         |
| app/webUi/customDomain/domain          | `transform.exampe.com`            | NA                           | **If** using custom domain   | Custom domain name                                                     |

## User Authentication

This solution supports two sources of user authentication. These can be enabled individually or together.

1. AWS Cognito Local Users. See `app/cognito/localUsers/*`

- Recommended for testing
- Users are managed within the AWS Account
- Users are not linked to existing user directories
- Configurable MFA settings

1. AWS Cognito SAML Users. See `app/cognito/saml/*`

- Recommended for production usage
- Users are managed by a SAML provider
- Users are linked to existing user directories
- Configuration of SAML provider is out of scope for this installation guide

### Enable Cognito SAML Provider Users

To integrate this solution with your existing user accounts it is integrated via SAML 2.0. This is supported by most user management systems, such as Azure Active Directory. A metadata URL is provided by the SAML provider and used by this solution. This URL looks like this `https://login.microsoftonline.com/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy/federationmetadata/2007-06/federationmetadata.xml?appid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. Configuration of Azure AD is out of scope for this installation guide.

This installation guide assumes that the user directory used for the SAML provider is Azure Active Directory. Configuration of Azure AD is out of scope for this installation guide. An Enterprise Application will need to be created. Dummy information can be used for the "Identifier (Entity ID)" and "Reply URL (Assertion Consumer Service URL)" to be updated later in this guide. The "App Federation Metadata Url" is a dependency for this guide.

See `app/cognito/saml/metadataUrl`
