<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

## Documentation

- [Documentation](https://aws-samples.github.io/document-translation/)
	- [Architecture](https://aws-samples.github.io/document-translation/docs/architecture/)
	- [Installation](https://aws-samples.github.io/document-translation/docs/installation/)
	- [Quick Start](https://aws-samples.github.io/document-translation/docs/quick-start.html)
	- [FAQ](https://aws-samples.github.io/document-translation/docs/faq.html)

## Overview

The project delivers a document translation portal with a web front end and automated pipeline with machine translation powered by [Amazon Translate](https://aws.amazon.com/translate/). 

This application is capable of translating all languages supported by the Amazon Translate (75 at the time of writing) and can translate to them all in a single job submission.

User authentication is required and handled by [AWS Cognito](https://aws.amazon.com/cognito/). Cognito can be integrated into various Identity Providers including any that support SAML 2.0 (E.g. Active Directory).

## Screenshots

**Past Translations Table**

![Web UI - My Translations Table](docs/assets/img/client_history.png)

**Multiple Language UI**

![Web UI - Multiple Languages](docs//assets/img/client_multi_lang.png)

**New Translations Form**

![Web UI - New Translation Form](docs/assets/img/client_create.png)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Tags, Releases

Tags and Releases are used to mark commits considered as verions with the format of vX.Y.Z. Any other tag is simply a tag. These versioned releases are for general use to try out this project. Tags and Releases are applied to commits in the main branch when it is functional. It is recommended to try the latest release. 

## Branches

The branch `main` is used for upstream development for this project. It **may** at times be non functional and require knowledge of the project to install, update, or fix. It is not intended for general use. 

The branch `dev` is used for upstream development ahead of `main`. It **will** have components/functions/features that are non functional. It is not intended for general use. Features in this `dev` branch may not be documented until they are merged into the `main` branch. 

### Dev Branch

The dev branch currently has the initial code for "Simply Readable" which is a Generative AI feature for text simplification and image generation to represent the text. 

- The Document Translation feature must be enabled until the help component is split out from it.
- The Document Translation PII feature is optional as the help component is not bundled with it.
- The Simply Readable feature must be explicitly enabled.
- When using the quick-start manually update to include the below.

```sh
export translation="true" # Needed for "help" until separated out
export translationPii="false"
export readable="true"
```

Recommended for any development installations.

```sh
export development="true" # Enables development features such as use of localhost:3000 with Cognito authentication
export appRemovalPolicy="destroy" # Enables deletion of app resources that hold state upon stack deletion
export pipelineRemovalPolicy="destroy" # Enables deletion of pipeline resources that hold state upon stack deletion
```
