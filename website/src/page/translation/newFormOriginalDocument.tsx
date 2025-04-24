// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React from "react";
import { useTranslation } from "react-i18next";
import { FcDocument } from "react-icons/fc";

import {
	Container,
	FileUpload,
	FormField,
	Header,
	SpaceBetween,
} from "@cloudscape-design/components";

const supportedFileTypes = [
	"text/plain",
	"text/html",
	"application/x-xliff+xml",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const supportedFileSizeMegaBytes = 20;
const supportedFileSizeKiloBytes = supportedFileSizeMegaBytes * 1000;
const supportedFileSizeBytes = supportedFileSizeKiloBytes * 1000;

// Size limit for direct translation using TranslateDocumentCommand (100KB)
export const directTranslationSizeLimit = 100000;

export default function NewFormOriginalDocument(props: {
	fileState: File | undefined;
	updateFileState: Function;
	formErrors: { [key: string]: boolean };
	updateFormErrors: Function;
}) {
	function onChangeFile(file: File | undefined) {
		if (!file) {
			props.updateFileState(undefined);
			return;
		}
		const isFileSupported = (file: File) => {
			const isFileTypeUnsupported = !supportedFileTypes.includes(file.type);
			const isFileSizeUnsupported = file.size > supportedFileSizeBytes;

			props.updateFormErrors((currentState: typeof props.formErrors) => ({
				...currentState,
				unsupportedFileType: isFileTypeUnsupported,
				unsupportedFileSize: isFileSizeUnsupported,
			}));

			if (isFileTypeUnsupported || isFileSizeUnsupported) {
				props.updateFileState(undefined);
				return false;
			} else return true;
		};

		if (isFileSupported(file)) {
			props.updateFormErrors((currentState: typeof props.formErrors) => ({
				...currentState,
				noOriginalDoc: false,
			}));
			props.updateFileState(file);
		}
	}

	const { t } = useTranslation();

	return (
		<>
			<Container
				header={
					<Header variant="h2">
						<FcDocument />
						&nbsp;{t("translation_new_original_document")}
					</Header>
				}
			>
				<FormField stretch>
					<SpaceBetween direction="vertical" size="xxl">
						<FileUpload
							data-testid="translation-new-upload"
							onChange={({ detail }) => onChangeFile(detail.value[0])}
							value={props.fileState ? [props.fileState] : []}
							accept={JSON.stringify(supportedFileTypes)}
							i18nStrings={{
								uploadButtonText: (e) => (e ? "Choose files" : "Choose file"),
								dropzoneText: (e) =>
									e ? "Drop files to upload" : "Drop file to upload",
								removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
								limitShowFewer: "Show fewer files",
								limitShowMore: "Show more files",
								errorIconAriaLabel: "Error",
							}}
							showFileLastModified
							showFileSize
							showFileThumbnail
							tokenLimit={3}
							errorText={
								(props.formErrors.noOriginalDoc &&
									t("translation_new_original_document_error_no_doc")) ||
								(props.formErrors.unsupportedFileType &&
									t(
										"translation_new_original_document_error_unsupported_type"
									)) ||
								(props.formErrors.unsupportedFileSize &&
									`${t("translation_new_original_document_error_too_large")} (${supportedFileSizeMegaBytes} MB/${supportedFileSizeKiloBytes} KB)`) ||
								(!props.fileState &&
									t("translation_new_original_document_error_no_doc"))
							}
						/>
					</SpaceBetween>
				</FormField>
			</Container>
		</>
	);
}
