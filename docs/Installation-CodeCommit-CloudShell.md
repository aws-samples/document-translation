<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

# Recommendation

This is the recommended installation method, using AWS CloudShell with Codecommit. CloudShell provides you with many of the tools required and provides permissions to complete the installation. This installation guide has been tested with CloudShell. If not using CloudShell you are expected to understand how to install and configure dependencies and change any actions to your particular system. 

# Walkthrough

1. Optional: [AI Services Opt-Out Policies](steps/ai-services-opt-out-policies.md)
2. Recommended: [Setup a dedicated AWS Account for this workload](steps/setup-an-aws-account.md)
3. Recommended: [Setup this project within CloudShell](steps/setup-this-project-within-cloudshell.md)
4. Optional: [Enable Macie for Pii detection](steps/macie.md)
5. Required: [Configure Solution Options](steps/options.md)
6. Required: [Deploy](steps/deploy.md)
7. Optional: [Update SAML Provider](steps/update-saml-provider.md)
8. Recommended: [Access the web UI](steps/access-web-ui.md)

# Walkthrough

1. [Optional: AI Services Opt-Out Policies](steps/ai-services-opt-out-policies.md)
2. [Setup a dedicated AWS Account for this workload](steps/setup-an-aws-account.md)
3. [Setup this project within CloudShell](steps/setup-this-project-within-cloudshell.md)
4. [Enable Macie for Pii detection](steps/macie.md)
5. [Configure Solution Options](steps/options.md)
6. [Deploy](steps/deploy.md)
7. [Optional: Update SAML Provider](steps/update-saml-provider.md)
8. [Access the web UI](steps/access-web-ui.md)

# Walkthrough

1. Do you wish to stay opt-in or opt-out of your data to be used for continual improvement of the AI services?
    - Opt-in: AWS Default. No action required
    - Opt-out: [AI Services Opt-Out Policies](steps/ai-services.md)
2. Do you wish to install this solution to a dedicated AWS account?
    - **Recommended** dedicated account: [Setup a dedicated AWS Account for this workload](steps/setup-an-aws-account.md)
    - Existing account: No action required.
3. Do you wish to use the CloudShell for running the deployment?
    - **Recommended** CloudShell: [Setup this project within CloudShell](steps/setup-this-project-within-cloudshell.md)
    - Other: You are expected to be able to map the CloudShell process to your setup.
4. Do  you wish to enable Pii detection features?
    - Enable Pii detection: [Enable Macie for Pii detection](steps/macie.md)
    - No Pii detection: No action required
5. **Required**: [Configure Solution Options](steps/options.md)
6. **Required**: [Deploy](steps/deploy.md)
7. Did you enable a SAML Provider?
    - Yes: [Update SAML Provider](steps/update-saml-provider.md)
    - No: No action required.
<!-- 8. Did you enable a Cognito Local Users?
    - Yes: [Create your first user](steps/create-cognito-local-user.md)
    - No: No action required. -->
1. Did you enable the Web UI feature?
    - Yes: [Access the web UI](steps/access-web-ui.md)
    - No: No action required.