---
layout: default
title: GitHub
parent: Source Service
grand_parent: Installation
nav_order: 2
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{: .note-title }
> Required
>
> This step is required when using GitHub as your source service.

{: .note-title }
> Note
>
> If you are not familiar with GitHub and do not use it for other projects consider using the [AWS CodeCommit method](/docs/installation/source-service/codecommit.md) instead. The AWS CodeCommit method has no requirements for GitHub accounts and repositories. You are expected to understand how to convert the use of CodeCommit to GitHub in other sections of the installation guide. 

## Prerequisites

- GitHub Account (Free tier compatible)
- GitHub Repository
- Copy project code into your repository

## Create a GitHub Access Token

1. Navigate to [Generate a GitHub token](https://github.com/settings/tokens) in the GitHub settings
2. Select "Generate new token"
3. Select "Generate new token (classic)"
4. Enter a memorable name (E.g. `aws-123456789012-codepipeline`)
5. Select an appropriate "Expiration" period
6. Select the following scopes in the "Select scopes" section
	- `repo`
	- `admin:repo_hook`

## Store the GitHub Token in AWS Secrets Manager

1. Navigate to [AWS Secrets Manager](https://console.aws.amazon.com/secretsmanager/landing)
2. Select "Store a new secret"
	 1. Select "Other type of secret" in the "Secret type" section
	 2. Select "Plaintext" in the "Key/value pairs" section (Note: The secret is stored encrypted. "Plaintext" here represents what the type of value you're entering it, not the storage mechanism)
	 3. Replace all the contents of the input box with your GitHub token
3. Select "Next"
	 1. Enter the name `github-token` for the "Secret name"
4. Select "Next", "Next", "Store"