// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { getUrl } from "@aws-amplify/storage";

import { configureS3Bucket } from "./configureS3Bucket";

interface Props {
	path: string;
	bucketKey: string;
}

export async function getPresignedUrl(props: Props) {
	try {
		configureS3Bucket(props.bucketKey);
		const result = await getUrl({
			path: props.path,
			options: {
				expiresIn: 60,
			},
		});
		return result.url.href;
	} catch (error) {
		console.log("Error getting URL:", error);
	}
}
