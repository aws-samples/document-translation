// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Sorts an array of data objects in descending order by the "createdAt" property
export default function sortDataByKey(priKey, secKey, data) {
	data.sort((a, b) => {
		if (a[priKey] < b[priKey]) return 1;  // sort second object first
		if (b[priKey] < a[priKey]) return -1; // sort first object first
		if (a[secKey] < b[secKey]) return -1; // sort first object first
		if (b[secKey] < a[secKey]) return 1;  // sort second object first
		return 0; // equal objects
	});
	return data;
}