// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const fs = require('fs');
const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");

const client = new TranslateClient({
    maxAttempts: 100,
});

const sourceLanguageCode = "en";
const allLanguages = [
    "af", "am", "ar", "az", "bg", "bn", "bs", "ca", "cs", "cy", "da", "de", "el", "en", "es-MX", "es", "et", "fa-AF", "fa", "fi", "fr-CA", "fr", "ga", "gu", "ha", "he", "hi", "hr", "ht", "hu", "hy", "id", "is", "it", "ja", "ka", "kk", "kn", "ko", "lt", "lv", "mk", "ml", "mn", "mr", "ms", "mt", "nl", "no", "pa", "pl", "ps", "pt-PT", "pt", "ro", "ru", "si", "sk", "sl", "so", "sq", "sr", "sv", "sw", "ta", "te", "th", "tl", "tr", "uk", "ur", "uz", "vi", "zh-TW", "zh",
]

function createFilePath(languageCode) {
    const filePath = "../public/locales/" + languageCode + "/translation.json";
    console.log(filePath);
    return filePath;
}

async function translateString(sourceLanguageCode, targetLanguageCode, text) {

    const input = {
        Text: text,
        SourceLanguageCode: sourceLanguageCode,
        TargetLanguageCode: targetLanguageCode,
        Settings: {
            Formality: "FORMAL",
        },
    };
    const command = new TranslateTextCommand(input);
    const response = await client.send(command);
    // if (targetLanguageCode == "fr") {
    //     console.log(response.TranslatedText);
    // }
    return response.TranslatedText;
}

async function loopAllStrings(sourceLanguageCode, targetLanguageCode, sourceStrings) {
    const targetStrings = {};

    for (const [key, value] of Object.entries(sourceStrings)) {
        const translatedValue = await translateString(sourceLanguageCode, targetLanguageCode, value);
        targetStrings[key] = translatedValue;
    }

    const filename = createFilePath(targetLanguageCode);
    const content = JSON.stringify(targetStrings, null, "\t");

    fs.writeFile(filename, content, error => {
        if (error) {
            console.error(error);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loopAllTargets(sourceLanguageCode, sourceStrings, targetLanguages) {
    for (let target of targetLanguages) {
        loopAllStrings(sourceLanguageCode, target, sourceStrings);
        await sleep(1000);
    }
}

const sourceStrings = require(createFilePath(sourceLanguageCode));
const targetLanguages = allLanguages.filter(item => item !== sourceLanguageCode);
loopAllTargets(sourceLanguageCode, sourceStrings, targetLanguages);
