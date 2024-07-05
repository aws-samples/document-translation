// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = (event: any) => {
	const result = unmarshall(event);
	return result;
};
