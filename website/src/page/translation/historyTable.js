// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, Auth, Storage } from 'aws-amplify';

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css"
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
import sortDataByKey from '../../util/sortDataByKey';
import { formatJobNameId } from '../../util/formatJobNameId';
import { formatTimestamp } from '../../util/formatTimestamp';
// IMPORTS | GRAPHQL
const features = require("../../features.json");
let listJobs = null;
if (features.translation) {
	listJobs = require('../../graphql/queries').translationListJobs
} 

// CONFIGURE
// CONFIGURE | AMPLIFY
const cfnOutputs = require("../../cfnOutputs.json");

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
				const response = await API.graphql({
					query: listJobs,
					authMode: "AMAZON_COGNITO_USER_POOLS",
				});
				data = response.data.translationListJobs.items;
				data = sortDataByKey("createdAt", "id", data);
				updateJobs(data);
			} catch (error) {}
			return true;
		};
		fetchJobs();
	}, []);

	/* formatTargets */
	const formatTargets = (stringTargets) => {
		const targets = JSON.parse(stringTargets)
		const showSummary = (targets.length > 6) ? true : false;

		return (
			<>
				{showSummary && <span>{targets.length} {t('generic_languages')}</span>}
				{!showSummary && JSON.stringify(targets)
					.replaceAll(',', ', ')
					.replaceAll('[', '')
					.replaceAll(']', '')
					.replaceAll('"', '')
				}
			</>
		);
	}

	/* formatStatus */
	const formatStatus = (item) => {
		return (
			<>
				{item.jobStatus.toUpperCase() === "UPLOADED" && <TextContent class="isUploaded"><Spinner />&nbsp;{t('generic_status_uploaded')}</TextContent>}
				{item.jobStatus.toUpperCase() === "PROCESSING" && <TextContent class="isProcessing"><Spinner />&nbsp;{t('generic_status_processing')}</TextContent>}
				{item.jobStatus.toUpperCase() === "EXPIRED" && <TextContent class="isExpired">{t('generic_status_expired')}</TextContent>}
				{item.jobStatus.toUpperCase() === "ABORTED" && <TextContent class="isAborted">{t('generic_status_aborted')}</TextContent>}
				{item.jobStatus.toUpperCase() === "FAILED" && <TextContent class="isFailed">{t('generic_status_failed')}</TextContent>}
				{item.jobStatus.toUpperCase() === "TIMED_OUT" && <TextContent class="isTimedOut">{t('generic_status_timed_out')}</TextContent>}
				{item.jobStatus.toUpperCase() === "COMPLETED" &&
					<Button
						wrapText={false}
						onClick={(e) => download(item.translateKey)} download
					>{t('generic_download')}</Button>
				}
			</>
		);
	}

	/* download handler	*/
	async function download(stringKeys) {
		try {
			const keys = JSON.parse(stringKeys)
			const credentials = await Auth.currentUserCredentials();

			for (var i in keys) {
				console.log("Downloading key:", keys[i]);
				if (keys[i] === "sample") {
					console.log("Skipping sample download");
					return;
				}

				const userPrefix = "private/" + credentials.identityId + "/";
				const downloadKey = keys[i].replace(userPrefix, "");

				const signedURL = await Storage.get(downloadKey, {
					level: 'private',
					expires: 60,
					region: cfnOutputs.awsRegion,
					bucket: cfnOutputs.awsUserFilesS3Bucket,
				});
				console.log(signedURL);
				console.log("Downloading signedURL:", signedURL);
				window.open(signedURL, '_blank', 'noopener,noreferrer');
			};
		} catch (err) {
			console.log('error: ', err);
		}
	};

	return (
		<Table
			columnDefinitions={[
				{
					id: "jobName",
					header: t("generic_name"),
					cell: item => formatJobNameId(item.jobName, item.id),
					isRowHeader: true
				},
				{
					id: "createdAt",
					header: t("generic_created"),
					cell: item => formatTimestamp(item.createdAt),
				},
				{
					id: "source",
					header: t("generic_source"),
					cell: item => item.languageSource
				},
				{
					id: "targets",
					header: t("generic_targets"),
					cell: item => formatTargets(item.languageTargets)
				},
				{
					id: "status",
					header: t("generic_status"),
					cell: item => formatStatus(item)
				}
			]}
			stickyColumns={{ first: 0, last: 1 }}
			items={jobs}
			loadingText="Loading jobs"
			trackBy="id"
			empty={
				<Box
					margin={{ vertical: "xs" }}
					textAlign="center"
					color="inherit"
				>
					<SpaceBetween size="m">
						<b>{t('generic_history_none')}</b>
						<Button
							iconName="add-plus"
							onClick={(e) => navigate("/translation/new")}
						>{t('generic_create_new')}</Button>
					</SpaceBetween>
				</Box>
			}
			header={
				<Header
					counter={
						`(${jobs.length})`
					}
				>
					{t('generic_history')}
				</Header>
			}
		/>
	);
}