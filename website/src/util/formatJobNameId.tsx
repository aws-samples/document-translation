// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";

export function formatJobNameId(name: string, id: string) {
	return (
		<span>
			<span>{name}</span>
			<br />
			<span className="jobId">{id}</span>
		</span>
	);
}
