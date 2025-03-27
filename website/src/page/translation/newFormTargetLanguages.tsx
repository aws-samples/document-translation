// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FcTodoList } from "react-icons/fc";

import {
	Button,
	Checkbox,
	Container,
	FormField,
	Header,
	SpaceBetween,
} from "@cloudscape-design/components";

const languagesTarget = require("./languagesTarget.json");

interface Item {
	value: string;
	label: string;
}

interface CheckboxItem {
	value: string;
	label: string;
}

export default function NewFormTargetLanguages(props: {
	selectionState: string[];
	updateSelectionState: Function;
	originalLanguage: string;
}) {
	function selectAllTargetLanguages() {
		const languageTargets = languagesTarget.map((item: Item) => item.value);
		props.updateSelectionState(languageTargets);
	}

	function clearAllTargetLanguages() {
		props.updateSelectionState([]);
	}

	function onChangeLanguageTarget(propsLocal: {
		state: boolean;
		language: string;
	}) {
		console.log(
			`Setting target language "${propsLocal.language}" to "${propsLocal.state}"`
		);

		if (propsLocal.state) {
			if (!props.selectionState.includes(propsLocal.language)) {
				props.updateSelectionState(
					(currentState: typeof props.selectionState) => [
						...currentState,
						propsLocal.language,
					]
				);
			}
		} else {
			props.updateSelectionState((currentState: typeof props.selectionState) =>
				currentState.filter((lang) => lang !== propsLocal.language)
			);
		}
	}

	useEffect(() => {
		onChangeLanguageTarget({
			state: false,
			language: props.originalLanguage,
		});
	}, [props.originalLanguage]);

	const { t } = useTranslation();

	return (
		<>
			<Container
				header={
					<Header
						variant="h2"
						actions={
							<SpaceBetween direction="horizontal" size="xxl">
								<Button
									onClick={selectAllTargetLanguages}
									data-testid="translation-new-language-targets-selectall"
								>
									{t("generic_select_all")}
								</Button>
								<Button
									onClick={clearAllTargetLanguages}
									data-testid="translation-new-language-targets-clear"
								>
									{t("generic_clear")}
								</Button>
							</SpaceBetween>
						}
					>
						<FcTodoList />
						&nbsp;{t("translation_new_target_languages")}
					</Header>
				}
			>
				<FormField
					stretch
					errorText={
						props.selectionState.length === 0
							? t("translation_new_target_languages_error_no_selection")
							: ""
					}
				>
					<SpaceBetween direction="vertical" size="xxl">
						<ul
							className="list-can-collapse list-no-bullet"
							data-testid="translation-new-language-targets"
						>
							{languagesTarget.map((item: CheckboxItem, index: number) => (
								<React.Fragment key={index}>
									{index === 0 && (
										<li className="languageTargetsSeparator">
											{item.label[0].toLocaleUpperCase()}
										</li>
									)}
									{index > 0 &&
										item.label[0] !== languagesTarget[index - 1].label[0] && (
											<li className="languageTargetsSeparator">
												{item.label[0].toLocaleUpperCase()}
											</li>
										)}
									{item.value !== props.originalLanguage && (
										<li>
											<Checkbox
												checked={props.selectionState.includes(item.value)}
												onChange={(e) =>
													onChangeLanguageTarget({
														language: item.value,
														state: e.detail.checked,
													})
												}
											>
												{item.label}
											</Checkbox>
										</li>
									)}
								</React.Fragment>
							))}
						</ul>
					</SpaceBetween>
				</FormField>
			</Container>
		</>
	);
}
