// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React from "react";
import { useTranslation } from "react-i18next";

import {
	ContentLayout,
	Header,
	SpaceBetween,
} from "@cloudscape-design/components";

import HelpItems from "./helpItems";

export default function Help() {
	const { t } = useTranslation();

	return (
		<>
			<ContentLayout
				header={
					<SpaceBetween size="m">
						<Header variant="h1" description={t("help_description")}>
							{t("help_title")}
						</Header>
					</SpaceBetween>
				}
			>
				<HelpItems />
			</ContentLayout>
		</>
	);
}
