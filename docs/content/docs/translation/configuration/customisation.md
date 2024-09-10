---
title: Customisation
weight: 2
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="info" >}}
This step is **optional**.
{{< /callout >}}

You can customise various elements of this application to fit your unique requirements. This includes the aspects listed below. For all of the customisation options you must commit the appropriate file to your git repository.

## Sample jobs

Sample jobs are loaded with the following precedence. Once one of the sources provides data the loading stops. Once a user submits their first job it will be loaded going forward. Modifying the `jobData.json` file allows you to present a different list to brand new users. The `sampleJobData.json` shows the various states that a job can have, including failed states, which you may not want to show to end users.

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
