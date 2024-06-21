import { groupItemsByParent } from "./groupItemsByParent";

describe("groupItemsByParent", () => {
	test("groups items correctly", () => {
		const items = [
			{ id: 1, name: "3.1", parent: 3 },
			{ id: 2, name: "1.2", parent: 1 },
			{ id: 3, name: "1.3", parent: 1 },
			{ id: 4, name: "2.4", parent: 2 },
			{ id: 5, name: "3.5", parent: 3 },
		];

		const groupedItems = groupItemsByParent(items);

		expect(groupedItems).toEqual({
			3: [
				{ id: 1, name: "3.1", parent: 3 },
				{ id: 5, name: "3.5", parent: 3 },
			],
			1: [
				{ id: 2, name: "1.2", parent: 1 },
				{ id: 3, name: "1.3", parent: 1 },
			],
			2: [{ id: 4, name: "2.4", parent: 2 }],
		});
	});
});
