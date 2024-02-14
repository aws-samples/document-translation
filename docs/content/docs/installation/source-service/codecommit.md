---
title: CodeCommit
weight: 1
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="error" >}}
This step is **required**.

- If you intend to use CodeCommit as your source service this step is **required**.
- If not the [GitHub]({{< ref "github" >}}) configuration is **required**.
{{< /callout >}}

[AWS CodeCommit](https://aws.amazon.com/codecommit/) is a secure, highly scalable, fully managed source control service that hosts private Git repositories.

Using the terminal (E.g. [CloudShell]({{< ref "cloudshell" >}})) perform the following commands. The specific repository name of "document-translation" is not a requirement. You can substitute this name with another name. The name must be unique and is referenced in later steps. 

```sh
# Defile a repository name
export sourceGitRepo="document-translation"
# Create a CodeCommit repository
aws codecommit create-repository --repository-name ${sourceGitRepo}
```

Take note of the output provided by the above commands.