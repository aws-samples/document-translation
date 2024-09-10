---
title: Custom Domain
weight: 5
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

Once the app is deployed you will need to update your DNS provider (AWS Route 53) to point the custom domain to the CloudFront distribution.

- Navigate to AWS Route 53
- Create an `A` record for your custom domain
- Toggle the `Alias` option
- Select `CloudFront Distribution`
- Select the distribution created

The distribution URL can be verified from the CloudFormation stack `DocTran-<InstanceName>-App` outputs. The AWS Cloudfront URL with a structure of `abcdefg1234567.cloudfront.net`.
