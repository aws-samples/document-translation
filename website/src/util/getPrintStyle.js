// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import debug from "debug";
const log = debug("app:Util:getPrintStyle");

export function getPrintStyle() {
	const queryParameters = new URLSearchParams(window.location.search);
	const printStyle = queryParameters.get("printStyle");
	log("Found printStyle:", printStyle);
	return printStyle;
}