// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FcFinePrint } from "react-icons/fc";

import {
	Container,
	FormField,
	Header,
	Select,
	SpaceBetween,
} from "@cloudscape-design/components";

interface Item {
	value: string;
	label: string;
}
const languagesSource: Array<Item> = require("./languagesSource.json");

export default function NewFormOriginalLanguage(props: {
	languageSource: string;
	updateLanguageSource: Function;
}) {
	function onChangeLanguageSource(selectedLanguage: string) {
		props.updateLanguageSource(selectedLanguage);
	}

	function lookupLanguageLabel(language: string) {
		const languageLabel = languagesSource.find(
			(item: Item) => item.value === language
		);
		if (!languageLabel) {
			return "en";
		}
		return languageLabel.label;
	}

	const { t } = useTranslation();

	return (
		<>
			<Container
				header={
					<Header variant="h2">
						<FcFinePrint />
						&nbsp;{t("translation_new_original_language")}
					</Header>
				}
			>
				<FormField stretch>
					<SpaceBetween direction="vertical" size="xxl">
						<Select
							data-testid="translation-new-language-soruce"
							selectedOption={{
								value: props.languageSource,
								label: lookupLanguageLabel(props.languageSource),
							}}
							onChange={(e) =>
								onChangeLanguageSource(
									e.detail.selectedOption.value
										? e.detail.selectedOption.value
										: ""
								)
							}
							options={languagesSource}
							filteringType="auto"
						/>
					</SpaceBetween>
				</FormField>
			</Container>
		</>
	);
}
