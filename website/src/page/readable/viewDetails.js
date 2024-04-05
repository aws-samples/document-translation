// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from "react";
import { useTranslation } from "react-i18next";
import { API } from "aws-amplify";
// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import { Header, Table, Input } from "@cloudscape-design/components";

import { formatJobNameId } from "../../util/formatJobNameId";
import { formatTimestamp } from "../../util/formatTimestamp";

const features = require("../../features.json");
let readableUpdateJobMetadata = null;
if (features.readable) {
	readableUpdateJobMetadata =
		require("../../graphql/mutations").readableUpdateJobMetadata;
}

export default function ReadableViewDetails(props) {
	const { t } = useTranslation();

	async function saveJobNameToDb() {
		try {
			await API.graphql({
				query: readableUpdateJobMetadata,
				authMode: "AMAZON_COGNITO_USER_POOLS",
				variables: {
					id: props.metadataState.id,
					name: props.metadataState.name,
				},
			});
		} catch (error) {
			console.error(error);
			console.error("ERROR: " + error.errors[0].message);
		}
	}

	function updateJobName(e, setValue) {
		setValue(e.detail.value);
		props.setMetadataState((currentState) => {
			const newState = { ...currentState };
			newState.name = e.detail.value;
			return newState;
		});
	}

	return (
		<Table
			submitEdit={(e) => saveJobNameToDb(e)}
			columnDefinitions={[
				{
					id: "name",
					header: t("generic_name"),
					cell: (item) => formatJobNameId(item.name, item.id),
					isRowHeader: true,
					editConfig: {
						ariaLabel: "Name",
						editIconAriaLabel: "editable",
						errorIconAriaLabel: "Name Error",
						editingCell: (item, { currentValue, setValue }) => {
							return (
								<Input
									autoFocus={true}
									value={currentValue ?? item.name}
									onChange={(e) => updateJobName(e, setValue)}
									spellcheck
								/>
							);
						},
					},
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
			items={[props.metadataState]}
			loading={props.metadataState === undefined}
			loadingText="Loading jobs"
			header={<Header>{t("generic_details")}</Header>}
		/>
	);
}
