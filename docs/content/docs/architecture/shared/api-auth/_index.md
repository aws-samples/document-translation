---
title: API & Auth
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

The API used by this app is AWS AppSync which provides a GraphQL API. Authentication against the API is handled with AWS Cognito which provides user management and/or integration into a SAML 2.0 provider (E.g. Azure AD). 

Out of the box the API does not have any methods/actions available, nor any authentication. These are added by the specific features when enabled, following a code first schema defintion, implemented by the AWS CDK. 

Today all features require authentication. Some scope permissions down to individual users to access their particular jobs/data. Others are broader and allow any authenticated user to pull the information (E.g. Help-Information).

The AWS AppSync is protected by an AWS Web Application Firewall. This used the `AWSManagedRulesCommonRuleSet`.