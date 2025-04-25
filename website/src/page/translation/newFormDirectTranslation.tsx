// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React from "react";
import { useTranslation } from "react-i18next";
import { FcDownload } from "react-icons/fc";
import { useNavigate } from "react-router-dom";

import {
	Badge,
	Box,
	Button,
	Container,
	Header,
	ProgressBar,
	SpaceBetween,
	StatusIndicator,
} from "@cloudscape-design/components";

interface TranslationProgress {
	[key: string]: {
		status: "pending" | "translating" | "completed" | "error";
		error?: string;
		usedTerminology?: boolean;
	};
}

export default function NewFormDirectTranslation(props: {
	isTranslating: boolean;
	progress: TranslationProgress;
	completedCount: number;
	totalCount: number;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const getStatusIndicator = (status: string, usedTerminology?: boolean) => {
		switch (status) {
			case "pending":
				return (
					<StatusIndicator type="pending">
						{t("translation_direct_status_pending")}
					</StatusIndicator>
				);
			case "translating":
				return (
					<StatusIndicator type="in-progress">
						{t("translation_direct_status_translating")}
					</StatusIndicator>
				);
			case "completed":
				return (
					<SpaceBetween direction="horizontal" size="xs">
						<StatusIndicator type="success">
							{t("translation_direct_status_completed")}
						</StatusIndicator>
						{usedTerminology && (
							<Badge color="blue">{t("translation_direct_custom_terminology")}</Badge>
						)}
					</SpaceBetween>
				);
			case "error":
				return (
					<StatusIndicator type="error">
						{t("translation_direct_status_error")}
					</StatusIndicator>
				);
			default:
				return (
					<StatusIndicator type="stopped">
						{t("translation_direct_status_unknown")}
					</StatusIndicator>
				);
		}
	};

	return (
		<Container
			header={
				<Header variant="h2">
					<FcDownload />
					&nbsp;{t("translation_direct_translation")}
				</Header>
			}
		>
			<SpaceBetween direction="vertical" size="l">
				<Box>{t("translation_direct_description")}</Box>

				<ProgressBar
					value={props.completedCount}
					label={t("translation_direct_progress")}
					description={`${props.completedCount} ${t("translation_direct_of")} ${props.totalCount} ${t("translation_direct_languages")}`}
					status={props.isTranslating ? "in-progress" : "success"}
				/>

				{Object.entries(props.progress).map(([lang, info]) => (
					<div
						key={lang}
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div>{lang}</div>
						<div>{getStatusIndicator(info.status, info.usedTerminology)}</div>
						{info.error && (
							<div style={{ color: "red", fontSize: "0.9em" }}>
								{info.error}
							</div>
						)}
					</div>
				))}

				{!props.isTranslating && props.completedCount > 0 && (
					<Box textAlign="center">
						<Button
							variant="primary"
							onClick={() => navigate("/translation/history")}
							data-testid="translation-direct-return"
						>
							{t("translation_direct_return_to_history")}
						</Button>
					</Box>
				)}
			</SpaceBetween>
		</Container>
	);
}