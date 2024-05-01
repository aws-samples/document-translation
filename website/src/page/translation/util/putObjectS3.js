// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { configureS3Bucket } from "./configureS3Bucket";
import { prepareS3Key } from "./prepareS3Key";
// import { S3KeyTypes } from "../enums";
import { uploadData } from "aws-amplify/storage";

// interface Params {
// 	key: String;
//  keyType: S3KeyTypes;
// 	file: File;
// }

export async function putObjectS3(params) {

	const key = await prepareS3Key({
		key: params.key,
		keyType: params.keyType
	});

	try {
		configureS3Bucket();
		const result = await uploadData({
			path: key,
			data: params.file,
		}).result;
		console.log("putObjectS3 | result:", result)
	} catch (error) {
		console.log("Error uploading object:", error);
	}
}
