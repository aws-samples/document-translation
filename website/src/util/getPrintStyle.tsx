// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export function getPrintStyle() {
	const queryParameters = new URLSearchParams(window.location.search);
	const printStyle = queryParameters.get("printStyle");
	return printStyle;
}
