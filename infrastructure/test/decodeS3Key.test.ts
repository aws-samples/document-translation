const LambdaTester = require("lambda-tester");

const myHandler = require("../lambda/decodeS3Key/index").handler;

describe("handler", function () {
	it("test success", async function () {
		await LambdaTester(myHandler)
			.event({ payload: "foo+bar_lemon-%28pie%29" })
			.expectResult((result) => {
				expect(result).toEqual("foo bar_lemon-(pie)");
			});
	});
});
