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
