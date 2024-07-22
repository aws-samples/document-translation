// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier. MIT-0

// Takes a key <scope>/<identity>/<jobId>/<filename> and returns an object of the key components

interface Props {
	key: string;
}

type KeyDetails = {
	scope: string;
	identity: string;
	jobId: string;
	filename: string;
};

const keyRegex = /^(.*?)\/(.*?)\/(.*?)\/(.*?)$/;
const expect = "<scope>/<identity>/<jobId>/<filename>";

function isValidS3Key(key: string): key is string {
	return keyRegex.test(key);
}

function parseS3Key(key: string): KeyDetails {
	const match = key.match(keyRegex);
	if (!match) {
		throw new Error(`Invalid S3 key format: "${key}". Expect: "${expect}"`);
	}

	const [, scope, identity, jobId, filename] = match;

	return {
		scope,
		identity,
		jobId,
		filename,
	};
}

export function describeS3Key(props: Props): KeyDetails {
	console.log("describeS3Key", props.key);
	if (!isValidS3Key(props.key)) {
		throw new Error(
			`Invalid S3 key format: "${props.key}". Expect: "${expect}"`
		);
	}
	console.log("describeS3Key isValid");

	return parseS3Key(props.key);
}
