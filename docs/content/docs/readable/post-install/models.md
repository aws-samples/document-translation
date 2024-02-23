---
title: Models Creation
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{{< callout type="info" >}}
Premade example model definitions for text simplificaiton and image generation are provided at the bottom of this page.
{{< /callout >}}

{{< callout type="warning" >}}
The model you select must be pre-enabled within your AWS Bedrock Console via the "Model access" settings.
{{< /callout >}}

Simply Readable allows you to configure as many types of models you need for both text and images. Their configuration can be expanded and edited freely without redeployment of this app. The model details are stored within a DynamoDB database. As this is data rather than configuration it is not provided at the deployment time. Below are some sample model definitions to get you started and adapt as you see fit.

You can have as many model definitions are you need. The user is presented a drop down selector with a filter search to find what they need. If only a single mode definition exists the user is not presented with a drop down selector with only one entry.

## Model Definition Creation

Amazon Bedrock has a "playground" capability within the AWS Console. This will allow you to select from various different model vendors and version. You can try out lots of different configurations using the text input and sliders for the parameters. Once you are happy with the output of a particular configuration it can be copied into an appropriate DynamoDB entry for use within the app. 

DynamoDB has a table editor within the AWS Console. This makes editing models really easy allowing for iteration on the propmpts. You can either create each of the entry items via the editor, or simply pasted in a premade marshalled JSON, such as the examples below. A dedicated DynamoDB table is created per deployment purely for storing these model definitions. The name will follow the structure of `DocTran-<branch>-app-basereadablereadableModelmodelTable-xxxxxxxx-xxxxxxxxxxxxx`. 

## Model Definition Structure

{{< callout type="info" >}}
The below covers the structure unmarshalled.
{{< /callout >}}

| Field                | Type                      | Required?    | Description                                                            |
| -------------------- | ------------------------- | ------------ | ---------------------------------------------------------------------- |
| `id`                 | String                    | Yes          | A unique ID within the DynamoDB table                                  |
| `default`            | Boolean                   | No           | To mark the default model when the user does not choose one explicitly |
| `name`               | String                    | Yes          | Name shown to the user within the UI                                   |
| `type`               | String of `text`, `image` | Yes          | The type of the model used to separate them in the UI selectors        |
| `text`               | JSON                      | Yes if text  | Definition of the text model                                           |
| `text`.`modelId`     | String                    | Yes if text  | The model ID as specified by the Bedrock API                           |
| `text`.`parameters`  | JSON                      | Yes if text  | The parameters as specified by the model API                           |
| `text`.`prePrompt`   | String                    | Yes if text  | The prompt prefixed to the inputted text to instruct the model         |
| `image`              | JSON                      | Yes if image | Definition of the text model                                           |
| `image`.`modelId`    | String                    | Yes if image | The model ID as specified by the Bedrock API                           |
| `image`.`parameters` | JSON                      | Yes if image | The parameters as specified by the model API                           |
| `image`.`prePrompt`  | String                    | Yes if image | The prompt prefixed to the inputted text to instruct the model         |

## Example Model Definitions

{{< callout type="info" >}}
These examples are marshalled so they can be pasted directly into DyanmodDB. When marshalled the type is specified in the JSON (E.g. `"S"` is a string, `"N"` is a number).
{{< /callout >}}

### Text Simplifier

```json
{
	"id": { "S": "Text-01" },
	"default": { "BOOL": true },
	"name": { "S": "Text Simplifier" },
	"text": {
		"M": {
			"modelId": { "S": "anthropic.claude-v2" },
			"parameters": {
				"M": {
					"max_tokens_to_sample": { "N": "300" },
					"stop_sequences": { "L": [ { "S": "Human:" } ] },
					"temperature": { "N": "1" },
					"top_k": { "N": "250" },
					"top_p": { "N": "0.999" }
				}
			},
			"prePrompt": { "S": "Simplify the following text so it can be easily understood by those with a low reading age, use short sentences, explain any abbreviations or words that can have two meanings and separate the sentences in to new lines."
			}
		}
	},
	"type": { "S": "text" }
}
```

### Image Generator

{{< callout type="info" >}}
Is is possible to specify a text and image definition for a model. When both are specified the text model is run first with the text, the output of that run is then used by the image model. This allows for a Generative AI created prompt that is better suited for the image generator. Without this the text going into the image generator may be more matter of fact, rather than visually descriptive. 
{{< /callout >}}

```JSON
{
	"id": { "S": "Image-01" },
	"default": { "BOOL": false },
	"image": {
		"M": {
			"modelId": { "S": "stability.stable-diffusion-xl-v1" },
			"parameters": {
				"M": {
					"cfg_scale": { "N": "10" },
					"height": { "N": "1024" },
					"seed": { "N": "0" },
					"steps": { "N": "50" },
					"width": { "N": "1024" }
				}
			}
		}
	},
	"name": { "S": "No People" },
	"text": {
		"M": {
			"modelId": { "S": "anthropic.claude-v2" },
			"parameters": {
				"M": {
					"max_tokens_to_sample": { "N": "300" },
					"stop_sequences": { "L": [ { "S": "Human:" } ] },
					"temperature": { "N": "1" },
					"top_k": { "N": "250" },
					"top_p": { "N": "0.999" }
				}
			},
			"prePrompt": { "S": "You're a prompt engineer, trying to design a prompt for Stable Diffusion, so it can generate a photographic image to illustrate the following text, showing no people in the image:" }
		}
	},
	"type": { "S": "image" }
}
```
