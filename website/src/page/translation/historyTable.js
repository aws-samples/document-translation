// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	Table,
	Box,
	SpaceBetween,
	Button,
	Header,
	Spinner,
	TextContent,
} from "@cloudscape-design/components";

// IMPORTS | FUNCTIONS
import { formatJobNameId } from "../../util/formatJobNameId";
import { formatTimestamp } from "../../util/formatTimestamp";
import { amplifyConfigureAppend } from "../../util/amplifyConfigure";
import { useTranslationJobs } from "./hooks/useTranslationJobs";
import { getPresignedUrl } from "./util/getPresignedUrl";
import { S3KeyTypes } from "./enums";

const cfnOutputs = require("../../cfnOutputs.json");

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
	const jobs = useTranslationJobs();
	const { t } = useTranslation();
	const navigate = useNavigate();

	/* formatTargets */
	const formatTargets = (stringTargets) => {
		const targets = JSON.parse(stringTargets);
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
	const formatStatus = (item) => {
		return (
			<>
				{item.jobStatus.toUpperCase() === "UPLOADED" && (
					<TextContent class="isUploaded">
						<Spinner />
						&nbsp;{t("generic_status_uploaded")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "PROCESSING" && (
					<TextContent class="isProcessing">
						<Spinner />
						&nbsp;{t("generic_status_processing")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "EXPIRED" && (
					<TextContent class="isExpired">
						{t("generic_status_expired")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "ABORTED" && (
					<TextContent class="isAborted">
						{t("generic_status_aborted")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "FAILED" && (
					<TextContent class="isFailed">
						{t("generic_status_failed")}
					</TextContent>
				)}
				{item.jobStatus.toUpperCase() === "TIMED_OUT" && (
					<TextContent class="isTimedOut">
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
	async function downloadHandler(stringKeys) {
		try {
			const keys = JSON.parse(stringKeys);

			for (var i in keys) {
				const presignedUrl = await getPresignedUrl({
					key: keys[i],
					keyType: S3KeyTypes.SCOPE_USER_OBJECT,
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
					cell: (item) => formatJobNameId(item.jobName, item.id),
					isRowHeader: true,
				},
				{
					id: "createdAt",
					header: t("generic_created"),
					cell: (item) => formatTimestamp(item.createdAt),
				},
				{
					id: "source",
					header: t("generic_source"),
					cell: (item) => item.languageSource,
				},
				{
					id: "targets",
					header: t("generic_targets"),
					cell: (item) => formatTargets(item.languageTargets),
				},
				{
					id: "status",
					header: t("generic_status"),
					cell: (item) => formatStatus(item),
				},
			]}
			stickyColumns={{ first: 0, last: 1 }}
			items={jobs}
			loadingText="Loading jobs"
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
				<Header counter={`(${jobs.length})`}>{t("generic_history")}</Header>
			}
		/>
	);
}
