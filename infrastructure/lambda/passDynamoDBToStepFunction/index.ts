// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const util = require("util");
const aws = require("aws-sdk");
const stepfunctions = new aws.StepFunctions({ apiVersion: "2016-11-23" });

exports.handler = (event) => {
	console.log(
		util.inspect(event, { showHidden: false, depth: null, colors: false })
	);
	event.Records.every((record) => {
		if (record.eventName !== "INSERT") {
			return false; // New jobs only
		}

		const params: {
			stateMachineArn: string | undefined;
			name: string | undefined;
			input: string | undefined;
		} = {
			stateMachineArn: process.env.stateMachineArn,
			name: record.dynamodb.Keys.id.S,
			input: JSON.stringify(record),
		};

		console.log("Params:", JSON.stringify(params, null, 2));
		stepfunctions.startExecution(params, function (err, data) {
			if (err) console.log(err, err.stack);
			else console.log(data);
		});

		return true;
	});
};
export {};
