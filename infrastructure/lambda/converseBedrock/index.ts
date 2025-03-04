// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
	BedrockRuntimeClient,
	ConverseCommand,
	ConverseCommandInput,
	ConverseCommandOutput,
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
	input: ConverseCommandInput;
}

export const handler = async (event: event) => {
	console.log(JSON.stringify(event, null, 4));

	const input = event.input;
	if (!input) {
		throw new Error("Missing input");
	}

	const command = new ConverseCommand(input);

	const response: ConverseCommandOutput = await bedrockClient.send(command);
	console.log("response.$metadata", response.$metadata);
	const responseStatusCode = response.$metadata.httpStatusCode;
	if (responseStatusCode !== 200) {
		throw new Error(`Response status code: "${responseStatusCode}"`);
	}

	return response;
};
