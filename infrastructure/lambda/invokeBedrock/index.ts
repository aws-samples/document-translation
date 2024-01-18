// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
	BedrockRuntimeClient,
	InvokeModelCommand,
	InvokeModelCommandInput,
	InvokeModelCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

const BEDROCK_REGION: string | undefined =
	process.env.BEDROCK_REGION || undefined;

if (!BEDROCK_REGION) {
	throw new Error("Missing BEDROCK_REGION");
}

const bedrockClient: BedrockRuntimeClient = new BedrockRuntimeClient({
	region: BEDROCK_REGION,
});

interface event {
	ModelId: string;
	Body: any;
}

export const handler = async (event: event) => {
	console.log(JSON.stringify(event, null, 4));

	const modelId: string = event.ModelId;
	if (!modelId) {
		throw new Error("Missing modelId");
	}

	const body: any = event.Body;
	if (!body) {
		throw new Error("Missing body");
	}

	const input: InvokeModelCommandInput = {
		body: JSON.stringify(body),
		contentType: "application/json",
		accept: "application/json",
		modelId: modelId,
	};
	console.log("input", input);
	const command = new InvokeModelCommand(input);

	const response: InvokeModelCommandOutput = await bedrockClient.send(command);
	console.log("response.$metadata", response.$metadata);
	const responseStatusCode = response.$metadata.httpStatusCode;
	if (responseStatusCode !== 200) {
		throw new Error(`Response status code: "${responseStatusCode}"`);
	}

	const encodedResult = response.body;
	const stringResult = new TextDecoder().decode(encodedResult);
	const resultBody: any = JSON.parse(stringResult);

	const result = {
		Body: resultBody,
		ContentType: response.contentType,
	};

	return result;
};
