// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import i18n from "i18next";

interface Item {
	value: string;
	label: string;
}
const languagesSource: Array<Item> = require("../languagesSource.json");

export function getBrowserLanguage() {
	const fallbackLanguage = "en";
	function getLanguage() {
		return (
			i18n.language ||
			(typeof window !== "undefined" && window.localStorage.i18nextLng) ||
			fallbackLanguage
		);
	}
	const language = getLanguage();
	const isLanguageSupported = languagesSource.find(
		(item: Item) => item.value === language
	);
	if (isLanguageSupported) {
		return language;
	} else {
		return fallbackLanguage;
	}
}
