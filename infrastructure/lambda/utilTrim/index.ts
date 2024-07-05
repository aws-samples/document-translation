// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

interface event {
	string: string;
}

export const handler = async (event: event) => {
	if (!event.string) {
		throw new Error("string (string) is required");
	}

	return event.string.trim();
};
