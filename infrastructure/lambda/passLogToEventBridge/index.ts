// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
const client = new EventBridgeClient();
const zlib = require("zlib");

export const handler = async (event) => {
	if (!process.env.eventSource) {
		throw new Error("eventSource is not defined.");
	}
	if (!process.env.pathToDetailType) {
		throw new Error("pathToDetailType is not defined.");
	}

	console.log("event:", JSON.stringify(event, null, 4));
	const payload = Buffer.from(event.awslogs.data, "base64");
	const parsed = JSON.parse(zlib.gunzipSync(payload).toString("utf8"));
	const message = parsed.logEvents[0].message;
	const parsedMessage = JSON.parse(message);
	console.log("Decoded payload:", JSON.stringify(parsed));

	const input = {
		Entries: [
			{
				Source: `doctran.${process.env.eventSource}`,
				DetailType: parsedMessage[`${process.env.pathToDetailType}`],
				Detail: message,
			},
		],
	};

	console.log("Input:", input)

	const command = new PutEventsCommand(input);
	const response = await client.send(command);
	return response;
};
