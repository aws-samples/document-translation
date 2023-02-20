<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

# Access the web UI

- Navigate to the [CloudFormation Console](https://console.aws.amazon.com/cloudformation/home)
- Select the app stack (E.g. `DocTran-main-app`)
- Select the "Outputs" tab
- Navigate to the URL outputted by the for value `appHostedUrl`.

**Cognito Local Users**

Create your first user

- Navigate to the [AWS Cognito Console](https://console.aws.amazon.com/cognito/v2/home)
- Select the appropriate "User pool name"
- Select "Create user" in the "Users" section on the "Users" tab
- Complete the form as appropriate
  - Note: If you specify a password it will be emailed to the user email in plain text
- Select "Create user"

**Cognito SAML Provider Users**

Login using a user authorised to access the Entperise Application from your SAML provider.