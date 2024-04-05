// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Auth, Storage } from "aws-amplify";
import { useState, useEffect, useMemo, useCallback } from "react";
const cfnOutputs = require("../../../cfnOutputs.json");

export function useGetPresignedUrl(objectKey) {
	const [presignedUrl, setPresignedUrl] = useState(null);

	const memoizedGetPresignedUrl = useMemo(() => {
		return async (key) => {
			try {
				const credentials = await Auth.currentUserCredentials();
				const userPrefix = "private/" + credentials.identityId + "/";
				const downloadKey = key.replace(userPrefix, "");

				return await Storage.get(downloadKey, {
					level: "private",
					expires: 120,
					region: cfnOutputs.awsRegion,
					bucket: cfnOutputs.awsReadableS3Bucket,
				});
			} catch (error) {
				console.log("error: ", error);
			}
		};
	}, []);

	const fetchPresignedUrl = useCallback(async () => {
		if (!objectKey) return;
		try {
			const url = await memoizedGetPresignedUrl(objectKey);
			setPresignedUrl(url);
		} catch (error) {
			console.error("Error fetching pre-signed URL:", error);
		}
	}, [objectKey, memoizedGetPresignedUrl]);

	useEffect(() => {
		fetchPresignedUrl();
	}, [fetchPresignedUrl]);

	return presignedUrl;
}
