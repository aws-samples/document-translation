---
layout: default
title: Home
nav_order: 1
permalink: /
---

# Improving inclusion through automated Document Translation
{: .fs-9 }

A web user interface and workflow for document translations using the Amazon Translate service
{: .fs-6 .fw-300 }

[Get started now]({{ site.baseurl }}/docs/quick-start){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View it on GitHub](https://github.com/aws-samples/document-translation){: .btn .fs-5 .mb-4 .mb-md-0 }

---

The project delivers a document translation portal with a web front end and automated pipeline with machine translation powered by [Amazon Translate](https://aws.amazon.com/translate/). 

This application is capable of translating all languages supported by the Amazon Translate (75 at the time of writing) and can translate to them all in a single job submission.

User authentication is required and handled by [AWS Cognito](https://aws.amazon.com/cognito/). Cognito can be integrated into various Identity Providers including any that support SAML 2.0 (E.g. Active Directory).

## Screenshots

**Past Translations Table**

![Web UI - My Translations Table]({{ site.baseurl }}/assets/img/client_history.png)

**Multiple Language UI**

![Web UI - Multiple Languages]({{ site.baseurl }}/assets/img/client_multi_lang.png)

**New Translations Form**

![Web UI - New Translation Form]({{ site.baseurl }}/assets/img/client_create.png)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

