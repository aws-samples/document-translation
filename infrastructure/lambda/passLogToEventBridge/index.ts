// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
const client = new EventBridgeClient();

export const handler = async (event) => {
	console.log("Event:", JSON.stringify(event, null, 4));

	if (!process.env.eventSource) {
		throw new Error("eventSource is not defined.");
	}
	if (!process.env.pathToDetailType) {
		throw new Error("pathToDetailType is not defined.");
	}

	const input = {
		Entries: [
			{
				Source: `doctran.${process.env.eventSource}`,
				DetailType: event[process.env.eventSource],
				Detail: JSON.stringify(event),
			},
		],
	};

	const command = new PutEventsCommand(input);
	const response = await client.send(command);
	return response;
};
