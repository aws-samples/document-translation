// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

interface event {
	string: string;
}

export const handler = (event: event) => {
	return event.string.trim();
};
