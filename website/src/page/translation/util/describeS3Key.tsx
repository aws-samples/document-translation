// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier. MIT-0

// Takes a key s3://<bucket>/<scope>/<identity>/<jobId>/<stage>/<translateId>/<filename> and returns an object of the key components

interface Props {
	key: string;
}

type KeyDetails = {
	scope: string;
	identity: string;
	jobId: string;
	stage: string;
	translateId: string;
	filename: string;
};

const keyRegex = /^s3:\/\/([^/]+)\/(.*?)\/(.*?)\/(.*?)\/(.*?)\/(.*?)\/(.*?)$/;
const expect =
	"s3://<bucket>/<scope>/<identity>/<jobId>/<stage>/<translateId>/<filename>";

function isValidS3Key(key: string): key is string {
	return keyRegex.test(key);
}

function parseS3Key(key: string): KeyDetails {
	const match = key.match(keyRegex);
	if (!match) {
		throw new Error(`Invalid S3 key format: "${key}". Expect: "${expect}"`);
	}

	const [, bucket, scope, identity, jobId, stage, translateId, filename] =
		match;

	return {
		scope,
		identity,
		jobId,
		stage,
		translateId,
		filename,
	};
}

export function describeS3Key(props: Props): KeyDetails {
	if (!isValidS3Key(props.key)) {
		throw new Error(
			`Invalid S3 key format: "${props.key}". Expect: "${expect}"`
		);
	}

	return parseS3Key(props.key);
}
