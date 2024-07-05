// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React from "react";
import { useTranslation } from "react-i18next";
import { FcDocument } from "react-icons/fc";

import {
	Container,
	Header,
	SpaceBetween,
	TextContent,
} from "@cloudscape-design/components";

export default function NewFormSavingJob(props: {
	uploadDocument: boolean;
	submitJobInfo: boolean;
}) {
	const { t } = useTranslation();

	return (
		<Container
			header={
				<Header variant="h2">
					<FcDocument />
					&nbsp;{t("translation_submit_submitting")}
				</Header>
			}
		>
			<TextContent>
				<SpaceBetween direction="vertical" size="xxl">
					<p>{t("translation_submit_input_validated")}</p>
					{props.uploadDocument && (
						<p>{t("translation_submit_document_uploaded")}</p>
					)}
					{props.submitJobInfo && (
						<p>{t("translation_submit_input_submitted")}</p>
					)}
					{props.submitJobInfo && <h4>✅ {t("translation_submit_success")}</h4>}
				</SpaceBetween>
			</TextContent>
		</Container>
	);
}
