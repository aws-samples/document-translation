// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { fetchAuthSession } from "@aws-amplify/auth";

import {
	TranslateClient,
	TranslateDocumentCommand,
} from "@aws-sdk/client-translate";

interface TranslateDocumentProps {
	sourceLanguage: string;
	targetLanguage: string;
	document: File;
}

const cfnOutputs = require("../../../cfnOutputs.json");

export async function translateDocument(
	props: TranslateDocumentProps
): Promise<Uint8Array> {
	try {
		// Get credentials from Amplify
		const { credentials } = await fetchAuthSession();

		if (!credentials) {
			throw new Error("No credentials available");
		}

		// Create Translate client with credentials
		const translateClient = new TranslateClient({
			region: cfnOutputs.awsRegion,
			credentials: {
				accessKeyId: credentials.accessKeyId,
				secretAccessKey: credentials.secretAccessKey,
				sessionToken: credentials.sessionToken,
			},
		});

		// Prepare file content as Uint8Array
		const fileContent = await props.document.arrayBuffer();
		const documentContent = new Uint8Array(fileContent);

		// Create and execute the command
		const command = new TranslateDocumentCommand({
			SourceLanguageCode: props.sourceLanguage,
			TargetLanguageCode: props.targetLanguage,
			Document: {
				Content: documentContent,
				ContentType: props.document.type,
			},
		});

		const response = await translateClient.send(command);

		if (!response.TranslatedDocument?.Content) {
			throw new Error("No translated content received");
		}

		return response.TranslatedDocument.Content;
	} catch (error) {
		console.error("Error translating document:", error);
		throw error;
	}
}
