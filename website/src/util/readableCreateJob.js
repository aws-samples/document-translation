// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { API, Auth } from "aws-amplify";

const features = require("../features.json");
let readableCreateJob = null;
if (features.readable) {
	readableCreateJob = require('../graphql/mutations').readableCreateJob;
} 

export async function CreateJob() {
	try {
		const credentials = await Auth.currentUserCredentials();
		const identity = credentials.identityId;
		console.log("Identity:", identity);
		const response = await API.graphql({
			query: readableCreateJob,
			variables: {
				identity: identity,
			},
			authMode: "AMAZON_COGNITO_USER_POOLS",
		});
		const jobId = response.data.readableCreateJob.id;
		console.log(`Created job with ID "${jobId}"`);
		return jobId;
	} catch (error) {
		console.log("Error creating job");
		throw error;
	}
}