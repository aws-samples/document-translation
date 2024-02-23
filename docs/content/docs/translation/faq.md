---
title: FAQ
weight: 003
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

## General

### Can custom terminology be used?

Yes. The Amazon Translate service supports “Custom Terminology” which this solution can utilise. This allows you to provide terminology for things unique to your organisation such as brand names & project names. Custom Terminology files are simple CSV files with to/from mappings. 

[Custom Terminology]({{< ref "docs/translation/customisation#custom-terminology" >}})

### What document formats are supported?

This solution supports all document formats supported by the Amazon Translate service. Amazon Translate requires files to be UTF-8 encoded.

- Plain text.
- HTML.
- Word documents (.docx).
- PowerPoint Presentation files (.pptx).
- Excel Workbook files (.xlsx).
- XML Localization Interchange File Format (XLIFF) files (.xlf). Amazon Translate supports only XLIFF version 1.2.

[Amazon Translate Prerequisites](https://docs.aws.amazon.com/translate/latest/dg/async-prereqs.html)

### Are PDFs supported? 

PDF filetypes are not currently supported. PDF documents are not always structured documents as you would expect. It is possible to perform Optical Character Recognition (with a service such as Amazon Textract) on PDF documents to then subsequently perform translation. However, this is out of scope for this solution. 

[Translating PDF documents using Amazon Translate and Amazon Textract](https://aws.amazon.com/blogs/machine-learning/translating-scanned-pdf-documents-using-amazon-translate-and-amazon-textract/)

### What languages are supported?

This solution supports all languages supported by the Amazon Translate service. The latest information is available at [Amazon Translate FAQ](https://aws.amazon.com/translate/faqs/).

### How many languages can I translate to?

This solution supports translating an uploaded document to all languages supported by Amazon Translate. At the time of writing this is 75 languages. The latest information is available at [Amazon Translate FAQ](https://aws.amazon.com/translate/faqs/).

### What AWS Regions are supported?

Amazon Translate is used for the translation of document. This service is available in multiple regions. The latest information is available at [AWS Regional Services List](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/). 

### Is the solution resilient?

There are no single points of failure within the solution with all services being available across multiple Availability Zones within the deployed AWS Region.


### What is the job ID?

The front-end web user interface shows a Job ID for each uploaded document. This represents the Job across various services used within this solution. The Job ID can be used for troubleshooting. For example, the AWS Step Function workflow execution for a job has a matching ID. 

## Data & Privacy

### How long is data held?

There are different types of data stored by this solution:

- Uploaded documents
- Document filenames

Uploaded documents retention is a configurable option. The solution utilises S3 (Amazon Simple Storage Service) lifecycle polices to delete objects (files) after a configurable number of days. There is also PII (Personal Identifiable Information) detection as part of the workflow, through Macie (Amazon Sensitive Data Discovery and Protection), which allows for more stringent retention on files with PII. For example, you can set files with PII to be deleted after 2 days and non-PII after 7 days. 

Document filenames are preserved as part of the job history for a user. There is no limited retention period for filenames. 

### Are document content used outside of translation?

You may opt out of having your content used to improve and develop the quality of Amazon Translate and other Amazon machine-learning/artificial-intelligence technologies by using an AWS Organizations opt-out policy. For information about how to opt out, see below.

- [Managing AI services opt-out policy](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html)
- [Amazon Translate FAQ](https://aws.amazon.com/translate/faqs/)

### What services interact with uploaded data?

When documents are uploaded via this solution they are securely stored within Amazon S3 (Simple Storage Service). These documents are accessed via the Amazon Translate (Neural Machine Translation) and Amazon Macie (Sensitive Data Discovery and Protection) services on your behalf. The newly translated document is placed into the same S3 storage. Access is restricted to the owner of the file (original uploader). No other services interact with the contents of the documents. 

To provide a clear user experience, the filename of the documents is preserved throughout the workflow, allowing the user to interact with the UI with logical filenames. Therefore, the filename is used in more places, for tracking the files and jobs. This includes the API (AWS AppSync) for presenting the file names in the UI for the user to select. The workflow engine (AWS Step Functions) which orchestrates the workflow and various services. The job status database (AWS DynamoDB) which tracks the various jobs statuses. Processing serverless compute functions (AWS Lambda) which parse various stages of the workflow. 

Further details about how each individual service handles data can be found in their respective documentation. 

- [Amazon Translate](https://aws.amazon.com/translate/)
- [Amazon Macie](https://aws.amazon.com/macie/)
- [Amazon S3](https://aws.amazon.com/s3/) 

### Where is data stored?

This solution can be deployed to a AWS region of your choice. The services used within this solution are regional. Data uploaded to this solution does not leave the region in which it is deployed. For example, if this is deployed to EU-WEST-2 (London), then all data remains within the EU-WEST-2 (London) region.

## How many installations can I have?

There is no limit to the number of installations across multiple accounts. Within a single account there can be a maximum of 2 installations. This is due to the service quota of 2 subscriptions per log group and a shared default log group name for Amazon Macie. It is recommended to stick to this limit even when not using Macie in case that decision is changed in the future. 

In most cases a single installation is appropriate. Multiple teams can access the same installation. Users are only able to access files they own.  