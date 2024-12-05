// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	Box,
	Button,
	Container,
	FileUpload,
	Select,
	SpaceBetween,
} from "@cloudscape-design/components";

import { generateClient } from "@aws-amplify/api";
import { fetchAuthSession } from "@aws-amplify/auth";

import { UseReadableModels } from "./hooks/useReadableModels";

import { putObjectS3 } from "../../util/putObjectS3";

const features = require("../../features.json");
let readableCreateJobImport: string | null = null;
let readableUpdateJobMetadata: string | null = null;
if (features.readable) {
	readableCreateJobImport =
		require("../../graphql/mutations").readableCreateJobImport;
	readableUpdateJobMetadata =
		require("../../graphql/mutations").readableUpdateJobMetadata;
}

interface metadataState {
	id: string;
	name: string;
}

interface ReadableViewUploadProps {
	metadataState: metadataState;
	setMetadataState: React.Dispatch<React.SetStateAction<metadataState>>;
}

export default function ReadableViewUpload(props: ReadableViewUploadProps) {
	const { t } = useTranslation();
	const [file, setFile] = useState<File | undefined>();
	const [errorText, setErrorText] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const {
		modelState,
		modelDefault,
		loading: modelsLoading,
	} = UseReadableModels();
	const [selectedModel, setSelectedModel] = useState<any>(null);

	const handleSubmit = async () => {
		if (!file) return;

		// Only accept .docx files
		if (!file.name.endsWith(".docx")) {
			setErrorText(t("readable_upload_error_format"));
			return;
		}

		setIsLoading(true);

		let identityId;
		try {
			const authSession = await fetchAuthSession();
			identityId = authSession.identityId;
		} catch (error) {
			console.log("Error fetching identityId:", error);
		}

		const key = `private/${identityId}/${props.metadataState.id}/upload/${file.name}`;
		try {
			await putObjectS3({
				bucketKey: "awsReadableS3Bucket",
				path: key,
				file: file,
			});
		} catch (error) {
			console.error("Error uploading file:", error);
			setErrorText(t("readable_upload_error_generic"));
		}

		// Update job name if not set
		if (!props.metadataState.name) {
			try {
				const client = generateClient({ authMode: "userPool" });
				// Set job name to file name (without extension) if not already set
				const fileName = file.name.replace(/\.docx$/, "");
				await client.graphql({
					query: readableUpdateJobMetadata,
					variables: {
						id: props.metadataState.id,
						name: fileName,
					},
				});

				// Update local state with the new name
				props.setMetadataState((currentState) => ({
					...currentState,
					name: fileName,
				}));
			} catch (error) {
				console.error("Error updating job metadata:", error);
			}
		}

		// Create job import
		try {
			const client = generateClient({ authMode: "userPool" });
			if (readableCreateJobImport) {
				const response = await client.graphql({
					query: readableCreateJobImport,
					variables: {
						id: props.metadataState.id,
						identity: identityId,
						key: key,
						modelId: selectedModel?.value || modelDefault.text.id,
						status: "docimport",
					},
				});
				return await response.data.readableCreateJobImport;
			}
		} catch (error) {
			throw error;
		}
	};

	return (
		<Container>
			<SpaceBetween size="m">
				<Box variant="p">{t("readable_upload_description")}</Box>
				<Select
					selectedOption={
						selectedModel || modelState.text[modelDefault.text?.index || 0]
					}
					onChange={({ detail }) => setSelectedModel(detail.selectedOption)}
					options={modelState.text}
					loadingText="Loading models..."
					placeholder="Choose a model"
					loading={modelsLoading}
				/>
				<FileUpload
					onChange={({ detail }) => {
						setFile(detail.value[0]);
						setErrorText("");
					}}
					i18nStrings={{
						uploadButtonText: (e) => (e ? "Choose files" : "Choose file"),
						dropzoneText: (e) =>
							e ? "Drop files to upload" : "Drop file to upload",
						removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
						limitShowFewer: "Show fewer files",
						limitShowMore: "Show more files",
						errorIconAriaLabel: "Error",
					}}
					value={file ? [file] : []}
					errorText={errorText}
					constraintText=".docx files only"
					accept=".docx"
					multiple={false}
					showFileLastModified={false}
					showFileSize={false}
					tokenLimit={1}
				/>
				<Button
					variant="primary"
					disabled={!file || modelsLoading}
					loading={isLoading}
					onClick={handleSubmit}
				>
					Upload
				</Button>
			</SpaceBetween>
		</Container>
	);
}
