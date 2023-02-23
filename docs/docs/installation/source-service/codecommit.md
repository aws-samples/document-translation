---
layout: default
title: CodeCommit
parent: Source Service
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
> This step is required when using CodeCommit as your source service.

[AWS CodeCommit](https://aws.amazon.com/codecommit/) is a secure, highly scalable, fully managed source control service that hosts private Git repositories.

Using the terminal (E.g. [CloudShell](/docs/installation/prerequisite/cloudshell.md)) perform the following commands. The specific repository name of "document-translation" is not a requirement. You can substitute this name with another name. The name must be unique and is referenced in later steps. 

```sh
# Defile a repository name
export sourceGitRepo="document-translation"
# Create a CodeCommit repository
aws codecommit create-repository --repository-name ${sourceGitRepo}
```

Take note of the output provided by the above commands.