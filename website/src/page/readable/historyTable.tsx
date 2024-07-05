// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
	Box,
	Button,
	Header,
	Link,
	SpaceBetween,
	Table,
} from "@cloudscape-design/components";

import { useReadableJobs } from "./hooks/useReadableJobs";

import { formatJobNameId } from "../../util/formatJobNameId";
import { formatTimestamp } from "../../util/formatTimestamp";
import { CreateJob } from "../../util/readableCreateJob";

export default function HistoryTable() {
	const { jobs, loading } = useReadableJobs();
	const { t } = useTranslation();
	const navigate = useNavigate();

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
			loadingText={t("generic_loading")}
			loading={loading}
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
