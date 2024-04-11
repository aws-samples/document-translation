// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "aws-amplify";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	Table,
	Box,
	SpaceBetween,
	Button,
	Header,
	Link,
} from "@cloudscape-design/components";

// IMPORTS | GRAPHQL
import { CreateJob } from "../../util/readableCreateJob";
// IMPORTS | FUNCTIONS
import sortDataByKey from "../../util/sortDataByKey";
import { formatJobNameId } from "../../util/formatJobNameId";
import { formatTimestamp } from "../../util/formatTimestamp";

const features = require("../../features.json");
let listJobs = null;
if (features.readable) {
	listJobs = require("../../graphql/queries").readableListJobs;
}

export default function HistoryTable() {
	const [jobs, updateJobs] = useState([]);
	const { t } = useTranslation();
	const navigate = useNavigate();

	// RUN ONCE
	// RUN ONCE | FETCH JOBS
	useEffect(() => {
		async function fetchJobs() {
			let data;
			try {
				// Fetch jobs
				const response = await API.graphql({
					query: listJobs,
					authMode: "AMAZON_COGNITO_USER_POOLS",
				});
				data = response.data.readableListJobs.items;
				console.log(data);
				updateJobs(sortDataByKey("updatedAt", "id", data));
			} catch (error) {
				console.error(error);
				console.error("ERROR: " + error.errors[0].message);
			}
			return true;
		}
		fetchJobs();
	}, []);

	async function createAndNavigate() {
		const jobId = await CreateJob();
		navigate(`/readable/view?jobId=${jobId}`);
	}

	return (
		<Table
			columnDefinitions={[
				{
					id: "jobName",
					header: t("generic_name"),
					cell: (item) => (
						<Link
							href={`/readable/view?jobId=${item.id}`}
							onFollow={(event) => {
								if (!event.detail.external) {
									event.preventDefault();
									navigate(event.detail.href);
								}
							}}
						>
							{formatJobNameId(item.name, item.id)}
						</Link>
					),
					isRowHeader: true,
				},
				{
					id: "createdAt",
					header: t("generic_created"),
					cell: (item) => formatTimestamp(item.createdAt),
				},
				{
					id: "updatedAt",
					header: t("generic_updated"),
					cell: (item) => formatTimestamp(item.updatedAt),
				},
			]}
			items={jobs}
			loadingText="Loading jobs"
			trackBy="id"
			empty={
				<Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
					<SpaceBetween size="m">
						<b>{t("generic_history_none")}</b>
						<Button iconName="add-plus" onClick={createAndNavigate}>
							{t("generic_create_new")}
						</Button>
					</SpaceBetween>
				</Box>
			}
			header={
				<Header counter={`(${jobs.length})`}>{t("generic_history")}</Header>
			}
		/>
	);
}
