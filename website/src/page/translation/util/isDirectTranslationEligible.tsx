// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Checks if a file is eligible for direct translation using TranslateDocumentCommand
 * Criteria:
 * 1. File size is less than 100,000 bytes
 * 2. Either source or at least one target language is English ('en')
 */
export function isDirectTranslationEligible(
	file: File | undefined,
	sourceLanguage: string,
	targetLanguages: string[]
): boolean {
	if (!file) {
		return false;
	}

	// Check file size (less than 100,000 bytes)
	const isFileSizeEligible = file.size < 100000;

	// Check if source language is English
	const isSourceEnglish = sourceLanguage === "en";

	// Check if any target language is English
	const isAnyTargetEnglish = targetLanguages.includes("en");

	// Return true if file size is eligible AND either source or any target is English
	return isFileSizeEligible && (isSourceEnglish || isAnyTargetEnglish);
}
