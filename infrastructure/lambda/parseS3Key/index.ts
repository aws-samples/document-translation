// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const aws = require("aws-sdk");

exports.handler = (event, context, callback) => {
	const key: string = event.s3.object.key;
	const k: string[] = key.split("/");

	// KEY SPLIT POSSIBLE STRUCTURES
	// private/<cognitoId>/<jobId>/upload/<fileName.ext>
	// private/<cognitoId>/<jobId>/output/.write_access_check_file.temp
	// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/details/<lang>.auxiliary-translation-details.json
	// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/<lang>.<fileName.ext>
	// 0      / 1         / 2     / 3    / 4                                     / 5     / 6

	const permissionScope: string = k[0];
	const cognitoId: string = k[1];
	const jobId: string = k[2];
	const stage: string = k[3];

	console.log("permissionScope:", permissionScope);
	console.log("cognitoId:", cognitoId);
	console.log("jobId:", jobId);
	console.log("stage:", stage);

	let result: { [key: string]: string };
	let type: string;

	// MATCH UPLOAD
	// private/<cognitoId>/<jobId>/upload/<fileName.ext>
	// 0      / 1         / 2     / 3    / 4
	if (stage === "upload") {
		type = "upload";
		console.log("type:", type);
		result = {
			permissionScope,
			cognitoId,
			jobId,
			stage,
			type,
			filenameFull: k[4],
		};
		callback(null, result);
	}

	// MATCH TEMP
	// private/<cognitoId>/<jobId>/output/.write_access_check_file.temp
	// 0      / 1         / 2     / 3    / 4
	if (stage === "output" && k[4] === ".write_access_check_file.temp") {
		type = "temp";
		console.log("type:", type);
		result = {
			permissionScope,
			cognitoId,
			jobId,
			stage,
			type,
			filenameFull: k[4],
		};
		callback(null, result);
	}

	// MATCH DETAILS
	// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/details/<lang>.auxiliary-translation-details.json
	// 0      / 1         / 2     / 3    / 4                                     / 5     / 6
	if (
		stage === "output" &&
		k[4] !== ".write_access_check_file.temp" &&
		k[5] === "details"
	) {
		type = "details";
		console.log("type:", type);
		// <lang>.auxiliary-translation-details.json
		// 0     .1                            .2
		const n: string[] = k[6].split(".");
		result = {
			permissionScope,
			cognitoId,
			jobId,
			stage,
			type,
			filenameFull: k[6],
			language: n[0],
		};
		callback(null, result);
	}

	// MATCH OUTPUT
	// private/<cognitoId>/<jobId>/output/<accountId>-TranslateText-<translateId>/<lang>.<fileName.ext>
	// 0      / 1         / 2     / 3    / 4                                     / 5
	if (
		stage === "output" &&
		k[4] !== ".write_access_check_file.temp" &&
		k[5] !== "details"
	) {
		type = "output";
		console.log("type:", type);
		// <lang>.<fileName.ext>
		// 0     .a .b .c  .-1
		const n: string[] = k[5].split(".");
		result = {
			permissionScope,
			cognitoId,
			jobId,
			stage,
			type,
			filenameFull: k[5],
			language: n[0],
		};
		callback(null, result);
	}

	// ERROR
	callback(1, "Could not determine key structure");
};
