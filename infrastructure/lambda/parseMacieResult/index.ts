// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const zlib = require("zlib");
const aws = require("aws-sdk");
const stepfunctions = new aws.StepFunctions({ apiVersion: "2016-11-23" });

exports.handler = (event) => {
	const payload = Buffer.from(event.awslogs.data, "base64");
	const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));
	console.log("Decoded payload:", JSON.stringify(parsed));
	const logMessage = JSON.parse(parsed.logEvents[0].message);

	const message: {
		jobId: string;
		callbackAttribute: string | undefined;
		payload: string;
	} = {
		jobId: logMessage.jobName,
		callbackAttribute: process.env.attributeForPiiCallback,
		payload: "Pii detect complete",
	};

	const params: {
		stateMachineArn: string | undefined;
		input: string;
		name: string;
	} = {
		stateMachineArn: process.env.stateMachineArn,
		input: "" + JSON.stringify(message) + "",
		name: logMessage.jobName + "_pii",
	};

	stepfunctions.startExecution(params, function (err, data) {
		if (err) console.log(err, err.stack);
		else console.log(data);
	});
};
export {};
