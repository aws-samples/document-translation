<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

# Update SAML Provider

This guide assumes Azure Active Directory is the SAML provider.

This installation guide assumes that the user directory used for the SAML provider is Azure Active Directory. Configuration of Azure AD is out of scope for this installation guide. An Enterprise Application will need to be created. Dummy information can be used for the "Identifier (Entity ID)" and "Reply URL (Assertion Consumer Service URL)" to be updated later in this guide. The "App Federation Metadata Url" is a dependency for this guide.

Once installation is complete AWS CloudFormation will output the required values to update the SAML provider. 

- Navigate to the [CloudFormation Console](https://console.aws.amazon.com/cloudformation/home)
- Select the app stack (E.g. `DocTran-main-app`)
- Select the "Outputs" tab

Update the SAML provider with the outputs provided.

- Update the "Identifier (Entity ID)" with the output variable `samlIdentifier`
- Update the "Reply URL (Assertion Consumer Service URL)" with the output variable `samlReplyUrl`