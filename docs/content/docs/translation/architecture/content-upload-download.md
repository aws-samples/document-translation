---
title: Content
---


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