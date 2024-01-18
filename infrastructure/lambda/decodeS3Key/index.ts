// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export const handler = async (event, context, callback) => {
	const decoded = decodeURIComponent(event.payload);
	const result = decoded.replace(/\+/g, " ");
	callback(null, result);
};
