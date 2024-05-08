// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useEffect, useState } from "react";

import { generateClient } from "@aws-amplify/api";

import sortDataByKey from "../../../util/sortDataByKey";

const features = require("../../../features.json");
let listJobs: string;
if (features.translation) {
	listJobs = require("../../../graphql/queries").translationListJobs;
}

const client = generateClient({ authMode: "userPool" });

export const useTranslationJobs = () => {
	const [jobs, updateJobs] = useState([]);

	useEffect(() => {
		async function fetchJobs() {
			try {
				const response = await client.graphql({
					query: listJobs,
				});
				let data: any;
				if ("data" in response) {
					data = response.data.translationListJobs.items;
					data = sortDataByKey("createdAt", "id", data);
				}
				updateJobs(data);
			} catch (error) {}
			return true;
		}
		fetchJobs();
	}, []);

	return jobs;
};
