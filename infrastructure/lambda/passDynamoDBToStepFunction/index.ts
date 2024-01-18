// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
	SFNClient,
	StartExecutionCommand,
	StartExecutionCommandInput,
	StartExecutionCommandOutput,
} from "@aws-sdk/client-sfn";

import { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";

const client: SFNClient = new SFNClient({ apiVersion: "2016-11-23" });

const stateMachineArn: string | undefined =
	process.env.stateMachineArn || undefined;
if (!stateMachineArn) {
	throw new Error("stateMachineArn is not defined");
}

const envPkKey: string | undefined = process.env.pkValue || undefined;
let pkKey: string;
let pkType: string;
if (!envPkKey) {
	const pkKeyDefault = "id";
	console.log(`Env pkKey is not defined. Using default: "${pkKeyDefault}"`);
	pkKey = pkKeyDefault;

	const pkTypeDefault = "S";
	console.log(`Using default pkType: "${pkTypeDefault}"`);
	pkType = pkTypeDefault;
}

const envSkKey: string | undefined = process.env.skValue || undefined;
let skKey: string;
let skType: string;
if (!envSkKey) {
	console.log("Env skKey is not defined. No default.");
} else {
	const skTypeDefault = "S";
	console.log(`Using default skType: "${skTypeDefault}"`);
	skType = skTypeDefault;
}

function createStepFunctionExecutionName(record) {
	const { dynamodb } = record;

	const expectedPartitionKeyLength = 36;
	const expectedEventIdLength = 32;
	const nameSegmentsMax = 3;
	const nameSegmentsSeparators = nameSegmentsMax - 1;
	const stepFunctionExecutionMaxNameLength = 80;
	const expectedSortKeyLength =
		stepFunctionExecutionMaxNameLength -
		expectedPartitionKeyLength -
		expectedEventIdLength -
		nameSegmentsSeparators;

	if (!dynamodb) {
		throw new Error("No DynamoDB record");
	}
	if (!dynamodb.Keys) {
		throw new Error("No DynamoDB Keys");
	}

	const nameSegments: string[] = [];
	const pkValue = dynamodb.Keys[pkKey][pkType].slice(
		0,
		expectedPartitionKeyLength,
	);
	nameSegments.push(pkValue);

	let eventId: string = "";
	if (record.eventID) {
		eventId = record.eventID.slice(0, expectedEventIdLength);
		nameSegments.push(eventId);
	}

	let skSlug: string = "";
	if (skKey && skType && dynamodb.Keys[skKey] && dynamodb.Keys[skKey][skType]) {
		skSlug = dynamodb.Keys[skKey][skType].slice(0, expectedSortKeyLength);
		nameSegments.push(skSlug);
	} else {
		console.log("No SK value to add to name");
	}

	console.log(nameSegments);
	const name = nameSegments.join("_");
	console.log(`Processing: "${name}"`);
	return name;
}

export const handler = (event: DynamoDBStreamEvent) => {
	event.Records.every((record: DynamoDBRecord) => {
		const name = createStepFunctionExecutionName(record);

		const input: StartExecutionCommandInput = {
			stateMachineArn,
			name,
			input: JSON.stringify(record),
		};
		console.log("Input:", JSON.stringify(input, null, 2));

		const command = new StartExecutionCommand(input);
		client
			.send(command)
			.then((response: StartExecutionCommandOutput) => {
				console.log("response.$metadata", response.$metadata);
				const responseStatusCode = response.$metadata.httpStatusCode;
				if (responseStatusCode !== 200) {
					throw new Error(`Response status code: "${responseStatusCode}"`);
				}

				const responseExecutionArn = response.executionArn;
				if (!responseExecutionArn) {
					throw new Error("No executionArn returned");
				}

				const responseStartDate = response.startDate;
				if (!responseStartDate) {
					throw new Error("No startDate returned");
				}

				console.log(
					`Started "${responseExecutionArn}" at "${responseStartDate.toUTCString()}"`,
				);

				return responseExecutionArn;
			})
			.catch((error: Error) => {
				console.error(error);
				throw error;
			});
	});
};
