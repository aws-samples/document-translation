// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Utility functions for handling custom terminologies in translations
 */

import { fetchAuthSession } from "@aws-amplify/auth";
import { TranslateClient, ListTerminologiesCommand } from "@aws-sdk/client-translate";

const cfnOutputs = require("../../../cfnOutputs.json");

// Cache for terminologies to avoid repeated API calls
let terminologiesCache: { [key: string]: string } | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches all available custom terminologies from AWS Translate
 * @returns Object mapping terminology names to their ARNs
 */
export async function fetchCustomTerminologies(region: string): Promise<{ [key: string]: string }> {
  // Check if we have a valid cache
  const now = Date.now();
  if (terminologiesCache && (now - lastFetchTime < CACHE_TTL)) {
    return terminologiesCache;
  }

  try {
    // Get AWS credentials from the current session
    const { credentials } = await fetchAuthSession();
    if (!credentials) {
      throw new Error("No credentials available");
    }

    // Create client with proper credentials
    const client = new TranslateClient({
      region: cfnOutputs.awsRegion,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });
    
    // List all available terminologies
    const command = new ListTerminologiesCommand({});
    const response = await client.send(command);
    
    const terminologies: { [key: string]: string } = {};
    
    if (response.TerminologyPropertiesList) {
      response.TerminologyPropertiesList.forEach(terminology => {
        if (terminology.Name && terminology.Arn) {
          terminologies[terminology.Name] = terminology.Arn;
        }
      });
    }
    
    // Update cache
    terminologiesCache = terminologies;
    lastFetchTime = now;
    
    return terminologies;
  } catch (error) {
    console.error("Error fetching custom terminologies:", error);
    // Return empty object or cached data if available
    return terminologiesCache || {};
  }
}

/**
 * Gets custom terminology ARNs for target languages if available
 * @param targetLanguages Array of target language codes
 * @param region AWS region
 * @returns Object mapping language codes to terminology ARNs
 */
export async function getTerminologiesForLanguages(
  targetLanguages: string[],
  region: string
): Promise<{ [key: string]: string }> {
  try {
    const terminologies = await fetchCustomTerminologies(region);
    const matchedTerminologies: { [key: string]: string } = {};
    
    // Check if any target language code matches a terminology name
    targetLanguages.forEach(langCode => {
      if (terminologies[langCode]) {
        matchedTerminologies[langCode] = terminologies[langCode];
      }
    });
    
    return matchedTerminologies;
  } catch (error) {
    console.error("Error matching terminologies to languages:", error);
    return {};
  }
}