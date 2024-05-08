// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

interface Data {
	[key: string]: any;
}

// Sorts an array of data objects in descending order by the "createdAt" property
export default function sortDataByKey(
	priKey: string,
	secKey: string,
	data: Data
) {
	data.sort((a: Data, b: Data) => {
		if (a[priKey] < b[priKey]) return 1; // sort second object first
		if (b[priKey] < a[priKey]) return -1; // sort first object first
		if (a[secKey] < b[secKey]) return -1; // sort first object first
		if (b[secKey] < a[secKey]) return 1; // sort second object first
		return 0; // equal objects
	});
	return data;
}
