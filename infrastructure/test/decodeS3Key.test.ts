// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import LambdaTester from "lambda-tester";
import { handler as myHandler } from "../lambda/decodeS3Key/index";

describe("handler", function () {
	it("test success", async function () {
		await LambdaTester(myHandler)
			.event({ payload: "foo+bar_lemon-%28pie%29+%26+cake" })
			.expectResult((result) => {
				expect(result).toEqual("foo bar_lemon-(pie) & cake");
			});
	});
});
