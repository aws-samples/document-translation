// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
	Box,
	Button,
	Header,
	SpaceBetween,
	Spinner,
	Table,
	TextContent,
	Toggle,
	TextFilter,
} from "@cloudscape-design/components";

import { useTranslationJobs } from "./hooks/useTranslationJobs";

import { amplifyConfigureAppend } from "../../util/amplifyConfigure";
import { formatJobNameId } from "../../util/formatJobNameId";
import { formatTimestamp } from "../../util/formatTimestamp";
import { getPresignedUrl } from "../../util/getPresignedUrl";
import { describeS3Key } from "./util/describeS3Key";

const cfnOutputs = require("../../cfnOutputs.json");

interface Item {
	createdAt: number;
	id: string;
	jobName: string;
	jobStatus: string;
	languageSource: string;
	languageTargets: string;
	translateKey: string;
}

export default function HistoryTable() {
	const storageConfig = {
		Storage: {
			S3: {
				bucket: cfnOutputs.awsUserFilesS3Bucket,
				region: cfnOutputs.awsRegion,
			},
		},
	};
	amplifyConfigureAppend(storageConfig);
	const { jobs, loading } = useTranslationJobs();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [hideExpired, setHideExpired] = useState(true);
	const [ filteringText, setFilteringText ] = useState("");

	const toggleExpired = () => setHideExpired(!hideExpired);

	/* formatTargets */
	const formatTargets = (stringTargets: string) => {
		const targets: string[] = JSON.parse(stringTargets);
		const showSummary = targets.length > 6 ? true : false;

		return (
			<>
				{showSummary && (
					<span>
						{targets.length} {t("generic_languages")}
					</span>
				)}
				{!showSummary &&
					JSON.stringify(targets)
						.replaceAll(",", ", ")
						.replaceAll("[", "")
						.replaceAll("]", "")
						.replaceAll('"', "")}
			</>
		);
	};

	/* formatStatus */
	const formatStatus = (item: Item) => {
		return (
			<>
				{item.jobStatus.toUpperCase() === "UPLOADED" && (
					<TextContent data-status="isUploaded">
						<Spinner />
						&nbsp;{t("generic_status_uploaded")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "PROCESSING" && (
					<TextContent data-status="isProcessing">
						<Spinner />
						&nbsp;{t("generic_status_processing")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "EXPIRED" && (
					<TextContent data-status="isExpired">
						{t("generic_status_expired")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "ABORTED" && (
					<TextContent data-status="isAborted">
						{t("generic_status_aborted")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "FAILED" && (
					<TextContent data-status="isFailed">
						{t("generic_status_failed")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "TIMED_OUT" && (
					<TextContent data-status="isTimedOut">
						{t("generic_status_timed_out")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "COMPLETED" && (
					<Button
						wrapText={false}
						onClick={(e) => downloadHandler(item.translateKey)}
						download
					>
						{t("generic_download")}
					</Button>
				)}
			</>
		);
	};

	/* download handler	*/
	async function downloadHandler(stringKeys: string) {
		try {
			const keys = JSON.parse(stringKeys);

			for (var i in keys) {
				const k = describeS3Key({
					key: keys[i],
				});
				const presignedUrl = await getPresignedUrl({
					path: `${k.scope}/${k.identity}/${k.jobId}/${k.stage}/${k.translateId}/${k.filename}`,
					bucketKey: "awsUserFilesS3Bucket",
				});
				window.open(presignedUrl, "_blank", "noopener,noreferrer");
			}
		} catch (err) {
			console.log("error: ", err);
		}
	}

	return (
		<Table
			columnDefinitions={[
				{
					id: "jobName",
					header: t("generic_name"),
					cell: (item: Item) => formatJobNameId(item.jobName, item.id),
					isRowHeader: true,
				},
				{
					id: "createdAt",
					header: t("generic_created"),
					cell: (item: Item) => formatTimestamp(item.createdAt),
				},
				{
					id: "source",
					header: t("generic_source"),
					cell: (item: Item) => item.languageSource,
				},
				{
					id: "targets",
					header: t("generic_targets"),
					cell: (item: Item) => formatTargets(item.languageTargets),
				},
				{
					id: "status",
					header: t("generic_status"),
					cell: (item: Item) => formatStatus(item),
				},
			]}
			stickyColumns={{ first: 0, last: 1 }}
			items={jobs.filter(item => {
				if (filteringText) {
					return (item.jobName?.toLowerCase() ?? '').includes(filteringText.toLowerCase());
				}
				return !hideExpired || item.jobStatus.toUpperCase() !== "EXPIRED";
			})}
			loadingText={t("generic_loading")}
			loading={loading}
			trackBy="id"
			empty={
				<Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
					<SpaceBetween size="m">
						<b>{t("generic_history_none")}</b>
						<Button
							iconName="add-plus"
							onClick={(e) => navigate("/translation/new")}
						>
							{t("generic_create_new")}
						</Button>
					</SpaceBetween>
				</Box>
			}
			header={
				<Header
				counter={`(${jobs.length})`}
				actions={
					<Toggle
						onChange={({ detail }) => toggleExpired(detail.checked)}
						checked={hideExpired ? false : true}
					>
						{t("generic_status_expired")}
					</Toggle>
				}
				>
					{t("generic_history")}
				</Header>
			}
			stickyHeader
			stripedRows
			filter={
				<TextFilter
					filteringText={filteringText}
					onChange={({ detail }) => setFilteringText(detail.filteringText)}
					countText={`${jobs.filter(item => (item.jobName?.toLowerCase() ?? '').includes(filteringText.toLowerCase())).length} matches`}				/>
			}
		/>
	);
}
