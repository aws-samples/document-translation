// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const zlib = require("zlib");
const aws = require("aws-sdk");
const stepfunctions = new aws.StepFunctions({ apiVersion: "2016-11-23" });

export const handler = async (event) => {
	console.log("event:", JSON.stringify(event, null, 4));

	const payload = Buffer.from(event.awslogs.data, "base64");
	const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));
	console.log("Decoded payload:", JSON.stringify(parsed));
	const logMessage = JSON.parse(parsed.logEvents[0].message);

	const input: {
		jobId: string;
		callbackAttribute: string | undefined;
		payload: string;
	} = {
		jobId: logMessage.jobName,
		callbackAttribute: process.env.attributeForPiiCallback,
		payload: "Pii detect complete",
	};
	console.log("input:", JSON.stringify(input, null, 4));

	const params: {
		stateMachineArn: string | undefined;
		input: string;
		name: string;
	} = {
		stateMachineArn: process.env.stateMachineArn,
		input: JSON.stringify(input),
		name: logMessage.jobName + "_pii",
	};
	console.log("params:", JSON.stringify(params, null, 4));

	const data = await stepfunctions.startExecution(params).promise();
	console.log("data:", JSON.stringify(data, null, 4));

	return data;
};
