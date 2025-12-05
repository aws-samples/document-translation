// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { fetchAuthSession } from "@aws-amplify/auth";

import { getTerminologiesForLanguages } from "./customTerminologies";

import {
	TranslateClient,
	TranslateDocumentCommand,
} from "@aws-sdk/client-translate";

const cfnOutputs = require("../../../cfnOutputs.json");

interface TranslateDocumentParams {
	sourceLanguage: string;
	targetLanguage: string;
	document: File;
}

interface TranslateDocumentResult {
	translatedContent: Blob;
	usedTerminology: boolean;
}

/**
 * Translates a document using AWS Translate
 * @param params Object containing source language, target language, and document file
 * @returns Promise resolving to the translated document content and metadata
 */
export async function translateDocument(
	params: TranslateDocumentParams
): Promise<TranslateDocumentResult> {
	const { sourceLanguage, targetLanguage, document } = params;
	let usedTerminology = false;

	try {
		// Convert File to ArrayBuffer
		const arrayBuffer = await document.arrayBuffer();
		const documentBytes = new Uint8Array(arrayBuffer);

		// Get AWS credentials from the current session
		const { credentials } = await fetchAuthSession();
		if (!credentials) {
			throw new Error("No credentials available");
		}

		// Get custom terminologies for the target language
		const region = cfnOutputs.awsRegion;
		const terminologies = await getTerminologiesForLanguages(
			[targetLanguage],
			region
		);

		// Create the translate client with credentials
		const client = new TranslateClient({
			region,
			credentials: {
				accessKeyId: credentials.accessKeyId,
				secretAccessKey: credentials.secretAccessKey,
				sessionToken: credentials.sessionToken,
			},
		});

		// Prepare command parameters
		const commandParams: any = {
			Document: {
				Content: documentBytes,
				ContentType: document.type,
			},
			SourceLanguageCode: sourceLanguage,
			TargetLanguageCode: targetLanguage,
		};

		// Add terminology if available for this language
		if (terminologies[targetLanguage]) {
			commandParams.TerminologyNames = [targetLanguage];
			console.log(
				`Using custom terminology for ${targetLanguage}: ${terminologies[targetLanguage]}`
			);
			usedTerminology = true;
		}

		// Execute the translation
		const command = new TranslateDocumentCommand(commandParams);
		const response = await client.send(command);

		if (!response.TranslatedDocument?.Content) {
			throw new Error("No translated content received");
		}

		// Convert the translated content to a Blob
		const translatedContent = new Blob([response.TranslatedDocument.Content], {
			type: document.type,
		});

		return {
			translatedContent,
			usedTerminology,
		};
	} catch (error) {
		console.error("Error translating document:", error);
		throw error;
	}
}
