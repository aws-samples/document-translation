// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { getUrl } from "@aws-amplify/storage";

import { prepareS3Key } from "../../../util/prepareS3Key";

import { configureS3Bucket } from "./configureS3Bucket";

// import { S3KeyTypes } from "../../../enums";

// interface Params {
// 	key: String;
//  keyType: S3KeyTypes;
// }

export async function getPresignedUrl(params) {
	const key = await prepareS3Key({
		key: params.key,
		keyType: params.keyType,
	});

	try {
		configureS3Bucket();
		const result = await getUrl({
			path: key,
			options: {
				expiresIn: 60,
			},
		});
		return result.url.href;
	} catch (error) {
		console.log("Error getting URL:", error);
	}
}