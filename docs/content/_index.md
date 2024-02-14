---
weight: 1
title: Improving inclusion through automated Document Translation
---

> A web user interface and workflow for document translations using the Amazon Translate service

{{< cards >}}
  {{< card link="docs/quick-start/" title="Get started now" icon="cloud-upload" >}}
  {{< card link="https://github.com/aws-samples/document-translation" title="View it on GitHub" icon="external-link" >}}
{{< /cards >}}

The project delivers a document translation portal with a web front end and automated pipeline with machine translation powered by [Amazon Translate](https://aws.amazon.com/translate/). 

This application is capable of translating all languages supported by the Amazon Translate (75 at the time of writing) and can translate to them all in a single job submission.

User authentication is required and handled by [AWS Cognito](https://aws.amazon.com/cognito/). Cognito can be integrated into various Identity Providers including any that support SAML 2.0 (E.g. Active Directory).

## Screenshots

**Past Translations Table**

![Web UI - My Translations Table](/img/client_history.png)

**Multiple Language UI**

![Web UI - Multiple Languages](/img/client_multi_lang.png)

**New Translations Form**

![Web UI - New Translation Form](/img/client_create.png)

## Security

See [CONTRIBUTING](https://github.com/aws-samples/document-translation/blob/main/CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

