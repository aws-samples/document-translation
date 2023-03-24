// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Replaces the id, jobOwner, and translateKey properties of each object in the data array with sample values
export default function forceSampleValues(data) {
	console.log(data)
	return data.map((job) => {
		return {
			...job,
			id: "sample",
			jobOwner: "sample",
			translateKey: "{\"sample\":\"sample\"}"
		};
	});
}