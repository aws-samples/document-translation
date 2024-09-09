---
title: GitHub Token
weight: 1
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout >}}
This step is **required**.
{{< /callout >}}

## Create a GitHub Account

If you do not already have a GitHub account you can sign up for one. The free version is enough for generating the required token.

- [GitHub SignUp](https://github.com/signup)

## Token Permissions

Are you using the upstream AWS-Samples repository, or creating a fork of the codebase for your own modifications/development/management?

**If using the AWS-Sample repository**

- Minimum permission of `public_repo` is requred.

**If using your own repository**

- Public repository:
  - Minimum permission of `public_repo` is required.
  - Minimum permission of `repo` & `admin:repo_hook` is recommended.
- Private repository:
  - Minimum permission of `repo` & `admin:repo_hook` is required.

## Create API Token

{{< callout type="info" >}}
GitHub "Classic" tokens allow configuration of unlimited lifespan. GitHub "Fine-grained" tokens (currently Beta) do not. If you use the fine-grained type you are responsible for token rotation at expiry.
{{< /callout >}}

Follow the GitHub guide for creating the token with appropirate permissions.

- [Creating a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
