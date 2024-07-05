// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const myHandler = require("../lambda/utilRegexReplace/index").handler;

interface testDataPayload {
	pattern?: string;
	string?: string;
	replacement?: string;
	flags?: string;
}

interface testData {
	name: string;
	payload: testDataPayload;
	result: string;
}

// TEST DATA
const testSuccess: testData[] = [
	// GENERIC TESTS
	{
		name: "Remove single pattern",
		payload: {
			pattern: "PATTERN",
			string: "This is a single PATTERN",
		},
		result: "This is a single ",
	},
	{
		name: "Replace single pattern",
		payload: {
			pattern: "PATTERN",
			string: "This is a single PATTERN",
			replacement: "REPLACEMENT",
		},
		result: "This is a single REPLACEMENT",
	},
	{
		name: "Remove global pattern",
		payload: {
			pattern: "PATTERN",
			string: "This is a PATTERN and another PATTERN",
			flags: "g",
		},
		result: "This is a  and another ",
	},
	{
		name: "Replace global pattern",
		payload: {
			pattern: "PATTERN",
			string: "This is a PATTERN and another PATTERN",
			replacement: "REPLACEMENT",
			flags: "g",
		},
		result: "This is a REPLACEMENT and another REPLACEMENT",
	},
	{
		name: "No matching pattern",
		payload: {
			pattern: "PATTERN",
			string: "This is a string without a match",
		},
		result: "This is a string without a match",
	},
	{
		name: "Leading remove single pattern",
		payload: {
			pattern: "^PATTERN",
			string: "PATTERN This is a PATTERN and another PATTERN",
			flags: "g",
		},
		result: " This is a PATTERN and another PATTERN",
	},
	{
		name: "Leading replace single pattern",
		payload: {
			pattern: "^PATTERN",
			string: "PATTERN This is a PATTERN and another PATTERN",
			replacement: "REPLACEMENT",
			flags: "g",
		},
		result: "REPLACEMENT This is a PATTERN and another PATTERN",
	},
	{
		name: "Regex replace pattern, leading to colon",
		payload: {
			pattern: "^[\\w\\s]+:",
			string: "PATTERN TO FIND: This is a PATTERN and another PATTERN",
			replacement: "REPLACEMENT",
			flags: "g",
		},
		result: "REPLACEMENT This is a PATTERN and another PATTERN",
	},
	{
		name: "Regex remove pattern, leading to colon",
		payload: {
			pattern: "^[\\w\\s]+:",
			string: "PATTERN TO FIND: This is a PATTERN and another PATTERN",
			flags: "g",
		},
		result: " This is a PATTERN and another PATTERN",
	},
	{
		name: "Regex remove pattern, leading to colon, non-greedy",
		payload: {
			pattern: "^[\\w\\s]+:",
			string:
				"PATTERN TO FIND: PATTERN TO IGNORE: This is a PATTERN and another PATTERN",
		},
		result: " PATTERN TO IGNORE: This is a PATTERN and another PATTERN",
	},
	// EXPECTED SAMPLES
	{
		name: "Anthopic text simplifier",
		payload: {
			pattern: "^[\\w\\s]+:",
			string:
				" Lorem ipsum dolor sit amet:\n\nConsectetur adipiscing elit.  \n\nSed sed tempus arcu, ac scelerisque lorem.  \n\nAliquam erat volutpat.",
		},
		result:
			"\n\nConsectetur adipiscing elit.  \n\nSed sed tempus arcu, ac scelerisque lorem.  \n\nAliquam erat volutpat.",
	},
	{
		name: "Anthopic text simplifier, double colon",
		payload: {
			pattern: "^[\\w\\s]+:",
			string:
				" Lorem ipsum dolor sit amet: Consectetur adipiscing elit:\n\nSed sed tempus arcu, ac scelerisque lorem.  \n\nAliquam erat volutpat.",
		},
		result:
			" Consectetur adipiscing elit:\n\nSed sed tempus arcu, ac scelerisque lorem.  \n\nAliquam erat volutpat.",
	},
];

const testFail: testData[] = [
	{
		name: "Missing 'pattern'",
		payload: {
			string: "This is a string without a pattern",
		},
		result: "pattern (string) is required",
	},
	{
		name: "Missing 'string'",
		payload: {
			pattern: "This is a pattern without a string",
		},
		result: "string (string) is required",
	},
];
// SUCCESS
testSuccess.forEach((item) => {
	describe("handler", function () {
		test(item.name, async function () {
			await expect(myHandler(item.payload)).resolves.toEqual(item.result);
		});
	});
});

// FAILURES
testFail.forEach((item) => {
	describe("handler", function () {
		test(item.name, async function () {
			await expect(myHandler(item.payload)).rejects.toThrow(item.result);
		});
	});
});
