---
layout: default
title: Client
nav_order: 3
parent: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

## Overview

The client is created with [React JS](https://reactjs.org/), utilising [Amplify](https://aws.amazon.com/amplify/) libraries for interaction with AWS services. Clients can perform the following:

- Authenticate
- Upload new content
- Submit a new job
- Read their past jobs
- Download their translated content

![Client interaction](/assets/graphs/client_interaction.png)

## Process Steps

1. Client authentication
2. Original content upload 
3. Job info submission (DynamoDB Stream triggers workflow)

## Authentication

Authentication is provided by [Cognito](https://aws.amazon.com/cognito/) and is required to use the application. Non-authenticated users are redirected to a Cognito login page. Multiple authentication options are supported:

1. Cognito SAML 2.0 Provider Users (E.g. Azure Active Directory)
2. Cognito Local Users
3. Both 

![Client login](/assets/img/client_login_both.png)

## Content Upload/Download

Authenticated users are able to upload/download content into/from the [S3](https://aws.amazon.com/s3/) bucket with permissions scoped to their Cognito identity. This interaction is provided by the Amplify library. [File access levels](https://docs.amplify.aws/lib/storage/configureaccess/q/platform/js/) are configured as `private`. This allows a user to upload and download their own files but not other users.

> Private: Only accessible for the individual user. Files are stored under private/{user_identity_id}/ where the user_identity_id corresponds to the unique Amazon Cognito Identity ID for that user.

The web UI form uploads new original files for new jobs into S3 user scoped paths. Translated files are stored in the user scoped paths alongside uploads allowing them to be downloaded by the owner. Path structure follows this pattern.

- `private/{user_identity_id}/{job_id}/upload/{filename}.{ext}`
- `private/{user_identity_id}/{job_id}/output/{translate_id}/{language}.{filename}.{ext}`

**Other**
- Default encryption is enabled with SSE-S3. 
- File versioning is enabled.
- Lifecycle policies are enabled. The number of days is configurable.
    - A default lifecycle policy is applied to the bucket. By default any and all content is deleted after 7 days (bucket wide policy).
    - If PII is detected and the object is tagged with `PII`: `True` by the Main StepFunction a lifecycle policy of 3 day is applied (tag scoped policy).
    - If PII is not detected and the object is tagged with `PII`: `False` by the Main StepFunction a lifecycle policy of 14 day is applied (tag scoped policy). 

## Job Info

Job info is stored within the DynamoDB Job table accessed via [AppSync](https://aws.amazon.com/appsync/) with a GraphQL API. AppSync [authorisation rules](https://docs.amplify.aws/cli/graphql/authorization-rules/) are configured as `[{ allow: owner }]`. This allows a user to create and view their own records but not other users.

> Per user data access. Access is restricted to the "owner" of a record. Leverages amplify add auth Cognito user pool by default.

The web UI form creates new job records to trigger job workflows. The uploaded job info follows this pattern. The uploaded file path is constructed and used by the Main StepFunction. A DynamoDB table stream triggers the Main StepFunction when a new record is created. A job history, including download links for non expired translated files, is shown in the web UI. The `jobStatus` value is used to determine the status to show. 

```JSON
{
    "identity":          "<cognito identity id>",
    "id":                "<job id>",
    "name":              "<document name as job name>",
    "languageSource":    "<language code>",
    "languageTargets":   "<list of language codes>",
    "contentType":       "<document content type>",
    "translateStatus":   "<placeholder populated with language target codes>",
    "translateKey":      "<placeholder populated with language target codes>",
    "translateCallback": "<placeholder populated with language target codes>",
    "jobStatus":         "UPLOADED",
};
```
