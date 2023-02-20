<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

# Configure Macie (Optional. Required if using Pii detection feature)

> Required if using PII detection feature. Skip if not. 

Pii detection is an optional feature of this solution, allowing for more strict lifecycle policies on uploaded files based on whether Pii data is detected within the file. When this feature is not enabled the default lifecycle applies to all files without any Pii detection. E.g. this allows files with Pii detected to be deleted in 3 days, whilst files where no Pii is detected to be retained longer such as 7 days. These values are configurable.

**Enable Macie**

This command ensures that Macie is enabled within the account. 

```sh
aws macie2 enable-macie
```

If you see the following error that is expected when Macie is already enabled. It is safe to continue.

> An error occurred (ConflictException) when calling the EnableMacie operation: Macie has already been enabled

**Create Macie Log Group**

This command ensures that the Log Group exists if not already present. If already present the solution will use the existing Log Group. 

```sh
aws logs create-log-group --log-group-name /aws/macie/classificationjobs
```

If you see the following error that is expected when the Log Group already exists. It is safe to continue.

> An error occurred (ResourceAlreadyExistsException) when calling the CreateLogGroup operation: The specified log group already exists