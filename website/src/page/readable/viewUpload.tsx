// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileUpload, Container, SpaceBetween, Box, Button } from "@cloudscape-design/components";
import { putObjectS3 } from "../../util/putObjectS3";
import { fetchAuthSession } from "@aws-amplify/auth";

import { generateClient } from "@aws-amplify/api";
const features = require("../../features.json");
let readableCreateJobImport: string | null = null;
if (features.readable) {
	readableCreateJobImport = require("../../graphql/mutations").readableCreateJobImport;
}


interface ReadableViewUploadProps {
	jobId: string;
}

export default function ReadableViewUpload({ jobId }: ReadableViewUploadProps) {
	const { t } = useTranslation();
	const [file, setFile] = useState<File | undefined>();
	const [errorText, setErrorText] = useState("");
	const [isLoading, setIsLoading] = useState(false);

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

		const key = `private/${identityId}/${jobId}/upload/${file.name}`;
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

		// readableCreateJobImport
		try {
			console.log("readableCreateJobImport")
			const client = generateClient({ authMode: "userPool" });
			if (readableCreateJobImport) {
				const response = await client.graphql({
					query: readableCreateJobImport,
					variables: {
						id: jobId,
						identity: identityId,
						key: key,
						modelId: "Default-Example-Text-01",
						status: "docimport",
					},
				});
				console.log()
				return await await response.data.readableCreateJobImport;
			}
		} catch (error) {
			throw error;
		}

	};

	return (
		<Container>
			<SpaceBetween size="m">
				<Box variant="p">{t("readable_upload_description")}</Box>
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
					disabled={file ? false : true}
					loading={isLoading}
					onClick={handleSubmit}
				>
					Upload
				</Button>
			</SpaceBetween>
		</Container>
	);
}