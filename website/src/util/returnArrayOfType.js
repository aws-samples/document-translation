// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export function returnArrayOfType(allObjects, typeToReturn) {
    const result = [];
    allObjects.map((object) => {
        if (object.type === typeToReturn) {
            result.push(object);
        }
    });
    return result;
}