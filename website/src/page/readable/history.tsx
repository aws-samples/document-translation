// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
	Button,
	ContentLayout,
	Header,
	SpaceBetween,
} from "@cloudscape-design/components";

import { CreateJob } from "../../util/readableCreateJob";

import HistoryTable from "./historyTable";

export default function Jobs() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	async function createAndNavigate() {
		const jobId = await CreateJob();
		navigate(`/readable/view?jobId=${jobId}`);
	}

	return (
		<>
			<ContentLayout
				header={
					<SpaceBetween size="m">
						<Header
							variant="h1"
							description={t("readable_description")}
							actions={
								<Button
									variant="primary"
									iconName="add-plus"
									onClick={createAndNavigate}
								>
									{t("generic_create_new")}
								</Button>
							}
						>
							{t("readable_title")}
						</Header>
					</SpaceBetween>
				}
			>
				<HistoryTable />
			</ContentLayout>
		</>
	);
}
