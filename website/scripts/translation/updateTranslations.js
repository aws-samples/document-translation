// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Amazon Translate Automation Script
 *
 * This script automates the translation of JSON language files using Amazon Translate.
 * It takes a source language file and translates it into multiple target languages,
 * generating separate JSON files for each language.
 *
 * Key functionality:
 * - Reads source strings from a JSON file
 * - Translates to multiple target languages in parallel using Promise.all
 * - Generates language-specific JSON files
 * - Implements rate limiting, retry logic and error handling
 *
 * Prerequisites:
 * - AWS credentials configured
 * - Source language JSON file must exist
 * - File structure must follow: /public/locales/{languageCode}/translation.json
 *
 * @note The script uses formal translation settings for professional/business context
 */

const fs = require("fs").promises;
const path = require("path");
const {
	TranslateClient,
	TranslateTextCommand,
} = require("@aws-sdk/client-translate");

/**
 * Configure Amazon Translate client with retry count and rate limiter
 * This helps handle intermittent AWS API failures and rate limiting
 */
const client = new TranslateClient({
	maxAttempts: 5,
	retryMode: 'adaptive'
});

// Add jitter delay between API calls to handle rate limiting
const delay = (ms = 100) => new Promise(resolve => 
	setTimeout(resolve, ms + Math.floor(Math.random() * 100))
);

/**
 * Source language code and comprehensive list of target languages
 * Follows ISO 639-1 language codes with optional region specifiers
 */
const sourceLanguageCode = "en";
const allLanguages = [
	"af",
	"am",
	"ar",
	"az",
	"bg",
	"bn",
	"bs",
	"ca",
	"cs",
	"cy",
	"da",
	"de",
	"el",
	"en",
	"es-MX",
	"es",
	"et",
	"fa-AF",
	"fa",
	"fi",
	"fr-CA",
	"fr",
	"ga",
	"gu",
	"ha",
	"he",
	"hi",
	"hr",
	"ht",
	"hu",
	"hy",
	"id",
	"is",
	"it",
	"ja",
	"ka",
	"kk",
	"kn",
	"ko",
	"lt",
	"lv",
	"mk",
	"ml",
	"mn",
	"mr",
	"ms",
	"mt",
	"nl",
	"no",
	"pa",
	"pl",
	"ps",
	"pt-PT",
	"pt",
	"ro",
	"ru",
	"si",
	"sk",
	"sl",
	"so",
	"sq",
	"sr",
	"sv",
	"sw",
	"ta",
	"te",
	"th",
	"tl",
	"tr",
	"uk",
	"ur",
	"uz",
	"vi",
	"zh-TW",
	"zh",
];

/**
 * Creates file path and ensures directory exists
 * @param {string} languageCode - Target language code
 * @returns {string} Full file path
 */
async function createFilePath(languageCode) {
	const filePath = path.join(__dirname, "../../public/locales", languageCode, "translation.json");
	const dir = path.dirname(filePath);
	await fs.mkdir(dir, { recursive: true });
	console.log(`Processing: ${filePath}`);
	return filePath;
}

/**
 * Translates a single string using Amazon Translate
 * Uses formal translation setting for consistent professional tone
 * Includes error handling and retries
 *
 * @param {string} sourceLanguageCode - Source language ISO code
 * @param {string} targetLanguageCode - Target language ISO code
 * @param {string} text - Text to translate
 * @returns {Promise<string>} Translated text
 */
async function translateString(sourceLanguageCode, targetLanguageCode, text) {
	try {
		const input = {
			Text: text,
			SourceLanguageCode: sourceLanguageCode,
			TargetLanguageCode: targetLanguageCode,
			Settings: {
				Formality: "FORMAL",
				Profanity: "MASK"
			},
		};
		const command = new TranslateTextCommand(input);
		const response = await client.send(command);
		await delay();
		return response.TranslatedText;
	} catch (error) {
		console.error(`Translation failed for ${text}: ${error.message}`);
		throw error;
	}
}

/**
 * Processes all strings for a target language and saves to JSON file
 * Maintains the same key structure as source file for consistency
 * Supports nested objects
 *
 * @param {string} sourceLanguageCode - Source language ISO code
 * @param {string} targetLanguageCode - Target language ISO code
 * @param {Object} sourceStrings - Key-value pairs of strings to translate
 */
async function loopAllStrings(
	sourceLanguageCode,
	targetLanguageCode,
	sourceStrings
) {
	async function translateObject(obj) {
		const result = {};
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === 'object' && value !== null) {
				result[key] = await translateObject(value);
			} else if (typeof value === 'string') {
				result[key] = await translateString(
					sourceLanguageCode,
					targetLanguageCode,
					value
				);
			} else {
				result[key] = value;
			}
		}
		return result;
	}

	const translatedStrings = await translateObject(sourceStrings);
	const filename = await createFilePath(targetLanguageCode);
	const content = JSON.stringify(translatedStrings, null, "\t");

	await fs.writeFile(filename, content, 'utf8');
	console.log(`Successfully translated to ${targetLanguageCode}`);
}

/**
 * Main orchestration function that processes all target languages
 * Uses Promise.all for parallel processing with rate limiting
 *
 * @param {string} sourceLanguageCode - Source language ISO code
 * @param {Object} sourceStrings - Source strings to translate
 * @param {string[]} targetLanguages - Array of target language codes
 */
async function loopAllTargets(
	sourceLanguageCode,
	sourceStrings,
	targetLanguages
) {
	const batchSize = 5; // Process 5 languages at a time
	for (let i = 0; i < targetLanguages.length; i += batchSize) {
		const batch = targetLanguages.slice(i, i + batchSize);
		await Promise.all(
			batch.map(target => 
				loopAllStrings(sourceLanguageCode, target, sourceStrings)
					.catch(error => console.error(`Failed to translate ${target}: ${error.message}`))
			)
		);
		await delay(1000); // Add 1s delay between batches
	}
}

async function main() {
	try {
		const sourceFilePath = await createFilePath(sourceLanguageCode);
		const sourceStrings = require(sourceFilePath);
		const targetLanguages = allLanguages.filter(
			(item) => item !== sourceLanguageCode
		);
		await loopAllTargets(sourceLanguageCode, sourceStrings, targetLanguages);
		console.log('Translation completed successfully');
	} catch (error) {
		console.error('Translation failed:', error.message);
		process.exit(1);
	}
}

main();
