// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import debug from "debug";
const log = debug("app:Util:getPageJobId");

export function getPageJobId() {
	const queryParameters = new URLSearchParams(window.location.search);
	const jobId = queryParameters.get("jobId");
	log("Found jobId:", jobId);
	return jobId;
}