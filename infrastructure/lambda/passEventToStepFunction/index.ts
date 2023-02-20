// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Pass the raw event directly to a StepFunction
// This function is used where a StepFunction cannot be called directly by the source service
const aws = require("aws-sdk");
const stepfunctions = new aws.StepFunctions({ apiVersion: "2016-11-23" });

exports.handler = (event) => {
	const params: {
		stateMachineArn: string | undefined;
		input: unknown;
	} = {
		stateMachineArn: process.env.stateMachineArn,
		input: JSON.stringify(event),
	};

	stepfunctions.startExecution(params, function (err, data) {
		if (err) console.log(err, err.stack);
		else console.log(data);
	});
};
export {};
