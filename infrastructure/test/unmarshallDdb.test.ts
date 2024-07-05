// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const LambdaTester = require("lambda-tester");
const myHandler = require("../lambda/unmarshallDdb/index").handler;

interface testData {
	name: string;
	payload: any;
	result: any;
}

// TEST DATA
const testSuccess: testData[] = [
	{
		name: "Simple string",
		payload: {
			id: {
				S: "01234567-abcd-efgh-ijkl-891011121314",
			},
			order: {
				N: "1",
			},
		},
		result: {
			id: "01234567-abcd-efgh-ijkl-891011121314",
			order: 1,
		},
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
