<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

You can customise various elements of this applicaiton to fit your unique requirements. This includes the aspects listed below. For all of the customisation options you must commit the appropriate file to your git repository. 

- Logo (branding)
- Help information
    - Card order
    - Card titles
    - Card descriptions text
    - Card links
- Footer links
    - Link prefix
    - Link suffix
    - Link url
    - Link text
- Sample jobs (shown to users with no job history)
    - Created at datestamp
    - Job name
    - Status
    - Language source
    - Language targets

## Logo

Add a logo image called `logo.png` to the `src` directory. A transparent background is recommended. To accomodate different logo dimensions and sizes there is no restriction. The source image size will be rendered as is so scaling down the image is recommended.

## Help information

Help information is loaded with the following precendence. Once one of the sources provides data the loading stops. 

1. Local `helpData.json` file
1. Cloud `Help` database
1. Local `sampleHelpData.json` file

To add your own help information choose the appropriate data source.

- Use a local `helpData.json` file if the information will not change and you don't want to create a DB request when the Help tab is loaded.
- Use the Cloud `Help` database if the information should be updatable on-the-fly and by non-technical users.

### Using a local `helpData.json` file

Copy the `sampleHelpData.json` to `helpData.json` and modify. If the `helpData.json` file exists the `sampleHelpData.json` and Cloud `Help` database data won't be loaded. 

Only the `order` key is required and can be set to 0 for them all if no order is preferred. For other keys you can use any combination that you see fit. 

```json
[
	{
		"order": "1",
		"title": "What is Amazon Translate?",
		"description": "Amazon Translate is a neural machine translation service that delivers fast, high-quality, affordable, and customizable language translation. Neural machine translation is a form of language translation automation that uses deep learning models to deliver more accurate and more natural sounding translation than traditional statistical and rule-based translation algorithms. With Amazon Translate, you can localize content such as websites and applications for your diverse users, easily translate large volumes of text for analysis, and efficiently enable cross-lingual communication between users. Intento recently ranked Amazon Translate as the top machine translation provider in 2020 across 14 language pairs, 16 industry sectors and 8 content types.",
		"link": "https://aws.amazon.com/translate/"
	}
]
```

### Using the Cloud `Help` database

Only the `order` key is required and can be set to 0 for them all if no order is preferred. For other keys you can use any combination that you see fit. 

The DynamoDB Help table view provides a tabular view of the backend data for an application. You can use this feature to test your models and to provide team members with the ability to create and update an application's data in real-time instead of building admin views. 

- Load the AWS Console
- Navigate to Dynamo DB
- Select "Tables" > "Explore items" from the menu
- Select the `helpTable` table.

If the Cloud `Help` database data is loaded the `sampleHelpData.json` won't be loaded. 

## Footer links

Footer links are loaded with the following precendence. Once one of the sources provides data the loading stops. 

<!-- 1. Local `footerLinks.json` file
1. Cloud `footerlinks` database
1. Local `sampleFooterLinks.json` file -->

1. Local `footerLinks.json` file
1. Local `sampleFooterLinks.json` file

To add your own footer links copy the `sampleFooterLinks.json` to `footerLinks.json` and modify. If the `footerLinks.json` file exists the `sampleFooterLinks.json` won't be loaded. 

None of the keys are required so you can use any combination that you see fit. The sample file shows various possible combinations. 

```json
[
	{
		"prefix": "Prefix",
		"url": "/",
		"text": "link-text",
		"suffix": "suffix"
	}
]
```

Note: `footerLinks.json` is excluded from this project via the `.gitignore`. This prevents the file from being committed into git repositories.

## Sample jobs

Sample jobs are loaded with the following precendence. Once one of the sources provides data the loading stops. Once a user submits their first job it will be loaded going forward. Modifying the `jobData.json` file allows you to present a different list to brand new users. The `sampleJobData.json` shows the various states that a job can have, including failed states, which you may not want to show to end users.

1. Cloud `Jobs` database
1. Local `jobData.json` file
1. Local `sampleJobData.json` file

### Initial Job data with the `jobData.json` file

Copy the `sampleJobData.json` to `jobData.json` and modify. If the `jobData.json` file exists the `sampleJobData.json` won't be loaded. 

All keys are required.

```json
[
	{
		"createdAt": "2022-01-07T00:00:00.000Z",
		"name": "Sample completed.docx",
		"jobStatus": "COMPLETED",
		"languageSource": "en",
		"languageTargets": "[\"es-MX\"]"
	}
]
```

## Custom Terminology

Custom Terminology is an optional feature.

```sh
aws translate \
	import-terminology \
	--merge-strategy OVERWRITE \
	--terminology-data Format=CSV,Directionality=UNI \
	# Language code
	--name fr \
	# Your custom terminology file
	--data-file fileb://./fr.csv
```