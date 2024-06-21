import { returnArrayOfType } from "./returnArrayOfType";

describe("returnArrayOfType", () => {
	test("returns array of objects with the specified type", () => {
		const data = [
			{ type: "type1", value: "Value 1" },
			{ type: "type2", value: "Value 2" },
			{ type: "type1", value: "Value 3" },
			{ type: "type3", value: "Value 4" },
		];

		const filteredData = returnArrayOfType(data, "type1");

		expect(filteredData).toEqual([
			{ type: "type1", value: "Value 1" },
			{ type: "type1", value: "Value 3" },
		]);
	});
});
