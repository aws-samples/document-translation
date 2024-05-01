// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";

const features = require("../features.json");
let readableCreateJob = null;
if (features.readable) {
	readableCreateJob = require("../graphql/mutations").readableCreateJob;
}

export async function CreateJob() {
	const client = generateClient({ authMode: "userPool" });

	try {
		const authSession = await fetchAuthSession();
		const response = await client.graphql({
			query: readableCreateJob,
			variables: {
				identity: authSession.identityId,
			},
		});

		return await response.data.readableCreateJob.id;
	} catch (error) {
		throw error;
	}
}