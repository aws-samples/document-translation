// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { fetchAuthSession } from "@aws-amplify/auth";

import { S3KeyTypes, S3Scopes } from "../../../enums";

interface Props {
	key: string;
	keyType: typeof S3KeyTypes.Record;
}

export async function prepareS3Key(props: Props) {
	let key = props.key;
	let keyType = props.keyType;

	if (keyType === S3KeyTypes.OBJECT) {
		// Prepend user identity ID to object key
		try {
			const authSession = await fetchAuthSession();
			key = authSession.identityId + "/" + key;
		} catch (error) {
			console.log("Error fetching identityId:", error);
		}
		keyType = S3KeyTypes.USER_OBJECT;
	}

	if (keyType === S3KeyTypes.USER_OBJECT) {
		// Prepend scope to object key
		key = S3Scopes.PRIVATE + "/" + key;
		keyType = S3KeyTypes.SCOPE_USER_OBJECT;
	}

	if (keyType === S3KeyTypes.SCOPE_USER_OBJECT) {
		return key;
	}

	console.log("Error: Invalid keyType '" + keyType + "'");
}
