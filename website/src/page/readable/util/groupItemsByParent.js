// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export function groupItemsByParent(items) {
    const groupedItems = {};
    items.forEach((item) => {
        groupedItems[item.parent] = groupedItems[item.parent] || [];
        groupedItems[item.parent].push(item);
    });
    return groupedItems;
}