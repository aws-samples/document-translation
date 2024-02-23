---
title: Job Info
---

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
