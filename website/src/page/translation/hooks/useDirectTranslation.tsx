// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useState } from "react";

import { downloadFile } from "../util/downloadFile";
import { translateDocument } from "../util/translateDocument";

interface TranslationProgress {
	[key: string]: {
		status: "pending" | "translating" | "completed" | "error";
		error?: string;
	};
}

export function useDirectTranslation() {
	const [isTranslating, setIsTranslating] = useState<boolean>(false);
	const [progress, setProgress] = useState<TranslationProgress>({});
	const [completedCount, setCompletedCount] = useState<number>(0);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [hasError, setHasError] = useState<boolean>(false);

	/**
	 * Translates a document directly using the TranslateDocumentCommand
	 * and downloads the results for each target language
	 */
	const translateDocumentDirectly = async (
		file: File,
		sourceLanguage: string,
		targetLanguages: string[]
	): Promise<boolean> => {
		if (!file || targetLanguages.length === 0) {
			return false;
		}

		try {
			setIsTranslating(true);
			setCompletedCount(0);
			setTotalCount(targetLanguages.length);
			setHasError(false);

			// Initialize progress tracking for each target language
			const initialProgress: TranslationProgress = {};
			targetLanguages.forEach((lang) => {
				initialProgress[lang] = { status: "pending" };
			});
			setProgress(initialProgress);

			// Process each target language sequentially
			for (const targetLang of targetLanguages) {
				try {
					// Update status to translating
					setProgress((prev) => ({
						...prev,
						[targetLang]: { status: "translating" },
					}));

					// Call the translation service
					const translatedContent = await translateDocument({
						sourceLanguage,
						targetLanguage: targetLang,
						document: file,
					});

					// Generate filename with language code
					const fileNameParts = file.name.split(".");
					const extension = fileNameParts.pop() || "";
					const baseName = fileNameParts.join(".");
					const downloadFileName = `${baseName}_${targetLang}.${extension}`;

					// Download the translated file
					downloadFile(translatedContent, downloadFileName, file.type);

					// Update progress
					setProgress((prev) => ({
						...prev,
						[targetLang]: { status: "completed" },
					}));
					setCompletedCount((prev) => prev + 1);
				} catch (error) {
					console.error(`Error translating to ${targetLang}:`, error);
					setProgress((prev) => ({
						...prev,
						[targetLang]: {
							status: "error",
							error: error instanceof Error ? error.message : "Unknown error",
						},
					}));
					setHasError(true);
				}
			}

			return !hasError;
		} catch (error) {
			console.error("Error in direct translation process:", error);
			setHasError(true);
			return false;
		} finally {
			setIsTranslating(false);
		}
	};

	return {
		translateDocumentDirectly,
		isTranslating,
		progress,
		completedCount,
		totalCount,
		hasError,
	};
}
