// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

exports.handler = (event, context, callback) => {
	console.log("EVENT:", event);
	const resultList: string[] = [];
	for (const terminology of event.terminologies) {
		resultList.push(terminology.Name);
	}
	console.log("RESULT:", resultList);
	callback(null, resultList);
};
