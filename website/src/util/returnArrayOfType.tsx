// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export function returnArrayOfType(allObjects: any[], typeToReturn: string) {
	return allObjects.filter((object) => object.type === typeToReturn);
}
