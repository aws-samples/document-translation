<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

# FAQ

## Translation

### Can custom terminology be used?

Yes. The Amazon Translate service supports “Custom Terminology” which this solution can utilise. This allows you to provide terminology for things unique to your organisation such as brand names, project names, addresses, etc. Custom Terminology files are simple CSV files with to/from mappings.  


### What document formats are supported?

This solution supports all document formats supported by the Amazon Translate service. Amazon Translate requires files to be UTF-8 encoded.

- Plain text.
- HTML.
- Word documents (.docx).
- PowerPoint Presentation files (.pptx).
- Excel Workbook files (.xlsx).
- XML Localization Interchange File Format (XLIFF) files (.xlf). Amazon Translate supports only XLIFF version 1.2.

- Amazon Translate Prerequisites: https://docs.aws.amazon.com/translate/latest/dg/async-prereqs.html


### Are PDFs supported? 

PDF filetypes are not supported. PDF documents are not structured documents as you would expect. It is possible to perform Optical Character Recognition (with a service such as Amazon Textract) on PDF documents to then subsequently perform translation. However, this is out of scope for this solution. 

- Translating PDF documents using Amazon Translate and Amazon Textract https://aws.amazon.com/blogs/machine-learning/translating-scanned-pdf-documents-using-amazon-translate-and-amazon-textract/

### What languages are supported?

This solution supports all languages supported by the Amazon Translate service.

> Amazon Translate supports translation between the following 75 languages: Afrikaans, Albanian, Amharic, Arabic, Armenian, Azerbaijani, Bengali, Bosnian, Bulgarian, Chinese (Simplified), Catalan, Chinese (Traditional), Croatian, Czech, Danish, Dari, Dutch, English, Estonian, Finnish, French, French (Canada), Georgian, German, Greek, Gujarati, Haitian Creole, Hausa, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Irish, Italian, Japanese, Kannada, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Maltese, Mongolian, Marathi, Norwegian, Farsi (Persian), Pashto, Polish, Portuguese, Portuguese (Portugal), Punjabi, Romanian, Russian, Serbian, Sinhala, Slovak, Slovenian, Somali, Spanish, Spanish (Mexico), Swahili, Swedish, Filipino Tagalog, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Uzbek, Vietnamese, and Welsh. See this documentation page for more details.

- Amazon Translate FAQ: https://aws.amazon.com/translate/faqs/ 

### How many languages can I translate to?

This solution supports translating a single uploaded document to all languages supported by Amazon Translate. At the tiem of writing this is 75 languages. 


## General

### What services are used?

- [Amazon Translate](https://aws.amazon.com/translate/)
- [Amazon Macie](https://aws.amazon.com/macie/)
- [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/)
- [Amazon CloudFront](https://aws.amazon.com/cloudfront/)
- [Amazon Simple Storage Service (S3)](https://aws.amazon.com/s3/)
- [AWS X-Ray](https://aws.amazon.com/xray/)
- [AWS Cognito](https://aws.amazon.com/cognito/)
- [AWS AppSync](https://aws.amazon.com/appsync/)
- [AWS DynamoDB](https://aws.amazon.com/dynamodb/)
- [AWS Step Functions](https://aws.amazon.com/step-functions/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [AWS EventBridge](https://aws.amazon.com/eventbridge/)



### What AWS Regions are supported?

Amazon Translate is used for the translation of document. This service is available in multiple regions. For the latest list is available here. 

- Amazon Translate FAQ: https://aws.amazon.com/translate/faqs/ 
- AWS Regional Services List: https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/

At the time of writing the Region list is:

- US East 1 (Northern Virginia),
- US East 2 (Ohio),
- US West 2 (Oregon),
- EU West 1 (Ireland),
- EU West 2 (London),
- EU Central 1 (Frankfurt),
- Asia Pacific North East 2 (Seoul).

### Is the solution resillient?

There are no single points of failure within the solution with all services being available across multiple Availability Zones within the deployed AWS Region.


<!-- ## What is the job ID?

The front-end shows a Job ID for each uploaded document. This represents the Job across various services used within this solution. The Job ID can be used for troubleshooting. For example, the Step Function workflow execution for a job has a matching ID. A sub key (sub path/directory) within S3 has  -->


## Data & Privacy


### How long is data held?

There are different types of data stored by this solution:

- Uploaded documents
- Document filenames

Uploaded documents retention is a configurable option. The solution utilises S3 (Amazon Simple Storage Service) lifecycle polices to delete objects (files) after a configurable number of days. There is also PII (Personal Identifiable Information) detection as part of the workflow, through Macie (Amazon Sensitive Data Discovery and Protection), which allows for more stringent retention on files with PII. For example, you can set files with PII to be deleted after 2 days and non-PII after 7 days. 

Document filenames are preserved as part of the job history for a user. There is no limited retention period for filenames. 

### Are document content used outside of translation?

You may opt out of having your content used to improve and develop the quality of Amazon Translate and other Amazon machine-learning/artificial-intelligence technologies by using an AWS Organizations opt-out policy. For information about how to opt out, see below.

- Managing AI services opt-out policy: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html
- Amazon Translate FAQ: https://aws.amazon.com/translate/faqs/ 


### What services interact with uploaded data?

When documents are uploaded via this solution they are securely stored within S3 (Amazon Simple Storage Service). These documents are accessed via the Translate (AWS Neural Machine Translation) and Macie (AWS Sensitive Data Discovery and Protection) services on your behalf. The newly translated document is placed into the same S3 storage bucket. Access is restricted to the owner of the file (original uploader). No other services interact with the contents of the documents. 

To provide a clear user experience, the filename of the documents is preserved throughout the workflow, allowing the user to interact with the UI with logical filenames. Therefore, the filename is used in more places, for tracking the files and jobs. This includes the API (AWS AppSync) for presenting the file names in the UI for the user to select. The workflow engine (AWS Step Functions) which orchestrates the workflow and various services. The job status database (AWS DynamoDB) which tracks the various jobs statuses. Processing serverless compute functions (AWS Lambda) which parse various stages of the workflow. 

Futher details about how each individual service handles data can be found in their respective documentation. 

- Amazon Translate: https://aws.amazon.com/translate/
- Amazon Macie: https://aws.amazon.com/macie/
- Amazon S3: https://aws.amazon.com/s3/


### Where is data stored?

This solution can be deployed to a AWS region of your choice. The services used within this solution are regional. Data uploaded to this solution does not leave the region in which it is deployed. For example, if this is deployed to EU-WEST-2 (London), then all data remains within the EU-WEST-2 (London) region.


## How many installations can I have?

There is not limit to the number of installations across multiple accounts. Within a single account there can be a maximum of 2 installations. This is due to the limitation of 2 subscriptions per log group and a shared default log group name for Macie. It is recommended to stick to this limit even when not using Macie incase that decision is changed in the future. 