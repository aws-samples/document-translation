// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { getUrl } from "@aws-amplify/storage";

import { prepareS3Key } from "../../../util/prepareS3Key";

import { S3KeyTypes } from "../../../enums";
import { configureS3Bucket } from "./configureS3Bucket";

interface Props {
	key: string;
	keyType: typeof S3KeyTypes.Record;
}

export async function getPresignedUrl(props: Props) {
	const key = await prepareS3Key({
		key: props.key,
		keyType: props.keyType,
	});

	if (!key) return;

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