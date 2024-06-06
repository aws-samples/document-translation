// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { uploadData } from "@aws-amplify/storage";

import { prepareS3Key } from "../../../util/prepareS3Key";

import { S3KeyTypes } from "../../../enums";
import { configureS3Bucket } from "./configureS3Bucket";


interface Props {
	key: string;
	keyType: typeof S3KeyTypes.Record;
	file: File;
}

export async function putObjectS3(props: Props) {
	const key = await prepareS3Key({
		key: props.key,
		keyType: props.keyType,
	});

	try {
		configureS3Bucket();
		if (key) {
			const result = await uploadData({
				path: key,
				data: props.file,
			}).result;
			console.log("putObjectS3 | result:", result);
		}
	} catch (error) {
		console.log("Error uploading object:", error);
	}
}