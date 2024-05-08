// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export function getPageJobId() {
	const queryParameters = new URLSearchParams(window.location.search);
	const jobId = queryParameters.get("jobId");
	return jobId;
}
