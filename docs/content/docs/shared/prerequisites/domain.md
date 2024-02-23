---
title: Custom Domain
weight: 5
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="warning" >}}
This step is **conditional**.

- If you intend to use a custom domain/URL this step is **required**.
- If not this step can be **skipped**.
{{< /callout >}}

A custom domain allows you to specify an appropriate URL for this project. The default URL is provided by AWS Cloudfront with a structure of `abcdefg1234567.cloudfront.net`. A custom domain allows you to specify a prettier URL such as `document-translation.example.com`.

An SSL certificate is required for the custom domain. This must be added to your AWS Account in the `us-west-1` region. 

- [AWS Certificate Manager (ACM)](https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/request)

Once the certificate is available it can be used by this project. 

{{< callout type="info" >}}
The following should be performed at installation. These values are not persistent across CloudShell sessions.
{{< /callout >}}

```shell
# E.g.
# export webUiCustomDomain="<YOUR-DOMAIN>"
# export webUiCustomDomain="document-translation.example.com"
export webUiCustomDomain=""
#
# E.g.
# export webUiCustomDomainCertificate="<YOUR-CERTIFICATE-ARN>"
# export webUiCustomDomainCertificate="arn:aws:acm:us-east-1:123456789012:certificate/abcdefgh-1234-5678-9012-ijklmnopqrst"
export webUiCustomDomainCertificate=""
```