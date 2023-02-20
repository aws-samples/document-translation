// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

exports.handler = (event, context, callback) => {
	const decoded = decodeURI(event.payload);
	const result = decoded.replace(/\+/g, " ");
	callback(null, result);
};
