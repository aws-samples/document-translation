// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useEffect, useState } from "react";

import { generateClient } from "@aws-amplify/api";

const features = require("../../../features.json");
let listJobs = null;
if (features.readable) {
	listJobs = require("../../../graphql/queries").readableListJobs;
}
const client = generateClient({ authMode: "userPool" });

export const useReadableJobs = () => {
	const [jobs, updateJobs] = useState([]);
	const [loading, setLoading] = useState<Boolean>(true);

	useEffect(() => {
		async function fetchJobs() {
			let data;
			try {
				// Fetch jobs
				const response = await client.graphql({
					query: listJobs,
				});
				data = response.data.readableListJobs.items;
				updateJobs(data);
			} catch (error) {
				console.error(error);
			}
			setLoading(false);
			return true;
		}
		fetchJobs();
	}, []);

	return { jobs, loading };
};
