// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import forceSampleValues   from './forceSampleValues';

// Loads sample job history data from user or project
export default async function loadSampleData() {
	let data;
	try {
		// If user sample data is not available, load project sample data
		console.log("Loading user sample jobs");
		data = require("./jobData.json");
	} catch {
		// If user sample data is not available, load project sample data
		console.log("Loading project sample jobs");
		data = require("./sampleJobData.json");
	}
	
	// Add sample values to the job data
	data = await forceSampleValues(data);
	return data
}