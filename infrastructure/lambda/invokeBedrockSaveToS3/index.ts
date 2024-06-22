// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
	BedrockRuntimeClient,
	InvokeModelCommand,
	InvokeModelCommandInput,
	InvokeModelCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

import {
	S3Client,
	PutObjectCommand,
	PutObjectCommandOutput,
	PutObjectCommandInput,
} from "@aws-sdk/client-s3";

const BEDROCK_REGION: string | undefined =
	process.env.BEDROCK_REGION || undefined;

if (!BEDROCK_REGION) {
	throw new Error("Missing BEDROCK_REGION");
}

const bedrockClient: BedrockRuntimeClient = new BedrockRuntimeClient({
	region: BEDROCK_REGION,
});

const s3Client: S3Client = new S3Client({});

interface event {
	ModelId: string;
	Body: any;
	ResultS3Bucket: string;
	ResultS3Key: string;
	PathToResult: string;
	ItemId: string;
}

export const handler = async (event: event) => {
	console.log(JSON.stringify(event, null, 4));

	if (!event.ModelId) {
		throw new Error("Missing modelId");
	}
	const modelId: string = event.ModelId;

	if (!event.Body) {
		throw new Error("Missing body");
	}
	const body: any = event.Body;

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
		console.log("Bedrock request failed. Non 200 status code");
		throw new Error(`Response status code: "${responseStatusCode}"`);
	}

	const encodedResult = response.body;
	const stringResult = new TextDecoder().decode(encodedResult);
	const resultBody: any = JSON.parse(stringResult);

	// WRITE TO S3
	if (!event.ResultS3Bucket) {
		throw new Error("Missing ResultS3Bucket");
	}
	if (!event.ResultS3Key) {
		throw new Error("Missing ResultS3Key");
	}
	if (!event.PathToResult) {
		throw new Error("Missing PathToResult");
	}

	const getResultFromPath = (object: any, path: string) => {
		return path.split(".").reduce(
			(callbackFn, initialValue) => callbackFn[initialValue],
			object,
		)
	}

	const putObjectRequestInput: PutObjectCommandInput = {
		ContentType: "image/png",
		Key: event.ResultS3Key,
		Bucket: event.ResultS3Bucket,
		Body: Buffer.from(getResultFromPath(resultBody, event.PathToResult), "base64"),
		ContentEncoding: "base64",
	};
	const putObjectRequestCommand = new PutObjectCommand(putObjectRequestInput);
	const putObjectResponse: PutObjectCommandOutput = await s3Client.send(
		putObjectRequestCommand,
	);
	const pubObjectResponseStatusCode =
		putObjectResponse.$metadata.httpStatusCode;
	if (pubObjectResponseStatusCode !== 200) {
		console.log("S3 request failed. Non 200 status code");
		throw new Error(`Response status code: "${pubObjectResponseStatusCode}"`);
	}

	const result = {
		key: event.ResultS3Key,
	};

	return result;
};
