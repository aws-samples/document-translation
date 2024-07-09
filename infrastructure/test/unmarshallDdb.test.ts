// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { handler as myHandler } from "../lambda/unmarshallDdb/index";

interface testData {
	name: string;
	payload: {
		id: { S: string };
		order: { N: string };
	};
	result: {
		id: string;
		order: number;
	};
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
