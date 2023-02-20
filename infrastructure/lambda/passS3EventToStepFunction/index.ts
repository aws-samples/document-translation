// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const util = require("util");
const aws = require("aws-sdk");
const stepfunctions = new aws.StepFunctions({ apiVersion: "2016-11-23" });

exports.handler = (event) => {
	console.log(
		util.inspect(event, { showHidden: false, depth: null, colors: false })
	);
	const key: string = event.Records[0].s3.object.key;
	const decodedKey: string = key.replace("%3A", ":");
	const keySplit: string[] = decodedKey.split("/");

	// Var keySplit POSSIBLE STRUCTURES
	// Ignored files
	// private/<cognitoId>/<jobId>/upload/<fileName.ext>
	// private/<cognitoId>/<jobId>/output/.write_access_check_file.temp
	// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/details/<lang>.auxiliary-translation-details.json
	// Desired file
	// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/<lang>.<fileName.ext>
	// 0      / 1         / 2     / 3    / 4                                     / 5     / 6

	if (keySplit[3] === "upload") {
		return false; // Ignore uploads
	}

	if (keySplit[4] === ".write_access_check_file.temp") {
		return false; // Ignore translate temp
	}

	if (keySplit[5] === "details") {
		return false; // Ignore translate details
	}

	const jobId: string = keySplit[2];
	const language: string = keySplit[5].split(".")[0];

	const input: {
		jobId: string;
		callbackAttribute: string;
		payload: string;
	} = {
		jobId,
		callbackAttribute: language,
		payload: decodedKey,
	};

	const params: {
		stateMachineArn: string | undefined;
		input: string;
		name: string;
	} = {
		stateMachineArn: process.env.stateMachineArn,
		input: JSON.stringify(input),
		name: jobId + "_" + language,
	};

	console.log("Params:", JSON.stringify(params, null, 2));
	stepfunctions.startExecution(params, function (err, data) {
		if (err) console.log(err, err.stack);
		else console.log(data);
	});
};
export {};
