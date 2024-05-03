// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";

import sortDataByKey from "../../../util/sortDataByKey";

const features = require("../../../features.json");
let listJobs = null;
if (features.readable) {
	listJobs = require("../../../graphql/queries").readableListJobs;
}
const client = generateClient({ authMode: "userPool" });

export const useReadableJobs = () => {
	const [jobs, updateJobs] = useState([]);

	useEffect(() => {
		async function fetchJobs() {
			let data;
			try {
				// Fetch jobs
				const response = await client.graphql({
					query: listJobs,
				});
				data = response.data.readableListJobs.items;
				updateJobs(sortDataByKey("updatedAt", "id", data));
			} catch (error) {
				console.error(error);
			}
			return true;
		}
		fetchJobs();
	}, []);

	return jobs;
};
