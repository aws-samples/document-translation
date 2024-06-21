import { orderArrayByKey } from "./orderArrayByKey";

describe("orderArrayByKey", () => {
	test("orders array correctly based on the specified key", () => {
		const data = [
			{ id: 3, name: "Item 3" },
			{ id: 1, name: "Item 1" },
			{ id: 2, name: "Item 2" },
		];

		const orderedData = orderArrayByKey(data, "id");

		expect(orderedData).toEqual([
			{ id: 1, name: "Item 1" },
			{ id: 2, name: "Item 2" },
			{ id: 3, name: "Item 3" },
		]);
	});
});
