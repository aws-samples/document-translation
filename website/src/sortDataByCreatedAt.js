// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Sorts an array of data objects in descending order by the "createdAt" property
export default function sortDataByCreatedAt(data) {
	data.sort((a, b) => {
		if (a.createdAt < b.createdAt) return 1;  // sort second object first
		if (b.createdAt < a.createdAt) return -1; // sort first object first
		if (a.id < b.id) return -1; // sort first object first
		if (b.id < a.id) return 1;  // sort second object first
		return 0; // equal objects
	});
	return data;
}