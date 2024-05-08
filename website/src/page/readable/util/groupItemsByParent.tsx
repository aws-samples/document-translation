// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

interface Item {
	id: string;
	name: string;
	parent: string;
}

export function groupItemsByParent(items: Item[]) {
	const groupedItems: { [key: string]: Item[] } = {};
	items.forEach((item) => {
		groupedItems[item.parent] = groupedItems[item.parent] || [];
		groupedItems[item.parent].push(item);
	});
	return groupedItems;
}
