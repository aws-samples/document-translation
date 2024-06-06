// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { getUrl } from "@aws-amplify/storage";

import { S3KeyTypes } from "../enums";
import { configureS3Bucket } from "./configureS3Bucket";
import { prepareS3Key } from "./prepareS3Key";

interface Props {
	key: string;
	keyType: typeof S3KeyTypes.Record;
	bucketKey: string;
}

export async function getPresignedUrl(props: Props) {
	const key = await prepareS3Key({
		key: props.key,
		keyType: props.keyType,
	});

	if (!key) return;

	try {
		configureS3Bucket(props.bucketKey);
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
