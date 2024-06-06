// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { amplifyConfigureAppend } from "./amplifyConfigure";

export async function configureS3Bucket(bucketKey: string) {
	const cfnOutputs = require("../cfnOutputs.json");

	const storageConfig = {
		Storage: {
			S3: {
				bucket: cfnOutputs[bucketKey],
				region: cfnOutputs.awsRegion,
			},
		},
	};
	amplifyConfigureAppend(storageConfig);
}
