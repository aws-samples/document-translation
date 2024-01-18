// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

interface event {
	string: string;
	pattern: string;
	replacement: string;
	flags: string;
}

export const handler = async (event: event) => {	

	if ( ! event.pattern ) {
		throw new Error("pattern (string) is required");
	};
	if ( ! event.string ) {
		throw new Error("string (string) is required");
	};
	
	let replaceValue: string;
	if ( event.replacement ) {
		replaceValue = event.replacement;
	} else {
		console.log('No replacement (string) provided, defaulting to empty string ""');
		replaceValue = "";
	};
	
	let searchValue: RegExp | string;
	if ( event.flags ) {
		searchValue = new RegExp(event.pattern, event.flags);
	} else {
		console.log('No regexp flags (string) provided, defaulting to no flag');
		searchValue = new RegExp(event.pattern);
	};

	return event.string.replace(searchValue, replaceValue);
};
