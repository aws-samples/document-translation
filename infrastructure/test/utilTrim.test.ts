// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const LambdaTester = require("lambda-tester");
const myHandler = require("../lambda/utilTrim/index").handler;

interface testDataPayload {
	string?: string;
}

interface testData {
	name: string;
	payload: testDataPayload;
	result: string;
}

// TEST DATA
const testSuccess: testData[] = [
	{
		name: "Trim spaces",
		payload: {
			string: " This is a string ",
		},
		result: "This is a string",
	},
	{
		name: "Trim new lines",
		payload: {
			string: "\n\nThis is a string\n\n",
		},
		result: "This is a string",
	},
	{
		name: "Trim tabs",
		payload: {
			string: "\t\tThis is a string\t\t",
		},
		result: "This is a string",
	},
	{
		name: "Trim spaces & new lines & tabs",
		payload: {
			string: "\n \t This is a string \t \n ",
		},
		result: "This is a string",
	},
];

const testFail: testData[] = [
	{
		name: "No string",
		payload: {},
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
