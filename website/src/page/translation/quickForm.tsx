// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FcFinePrint } from "react-icons/fc";
import { useNavigate } from "react-router-dom";

import {
	Button,
	Container,
	Form,
	FormField,
	Grid,
	Header,
	Select,
	SpaceBetween,
	Textarea,
} from "@cloudscape-design/components";

import { Predictions } from "@aws-amplify/predictions";

import { amplifyConfigureAppend } from "../../util/amplifyConfigure";

const cfnOutputs = require("../../cfnOutputs.json");
interface Item {
	value: string;
	label: string;
}
const targets: Array<Item> = require("./languagesTarget.json");

export default function QuickForm() {
	const [translationTextInput, setTranslationTextInput] = useState<string>("");
	const [translationTextOutput, setTranslationTextOutput] =
		useState<string>("");
	const [selectedTarget, updateSelectedTarget] = useState<Item>(targets[0]);
	const navigate = useNavigate();
	const { t } = useTranslation();

	function onChangeLanguageSource(selected: Item) {
		console.log(selected);
		updateSelectedTarget(selected);
	}

	const translateConfig = {
		Predictions: {
			convert: {
				translateText: {
					region: cfnOutputs.awsRegion,
				},
			},
		},
	};
	amplifyConfigureAppend(translateConfig);

	const submit = () => {
		if (translationTextInput.length === 0) return;
		Predictions.convert({
			translateText: {
				source: {
					text: translationTextInput,
					language: "auto",
				},
				targetLanguage: selectedTarget.value,
			},
		})
			.then((result) => setTranslationTextOutput(result.text))
			.catch((err) => console.log({ err }));
	};

	return (
		<>
			<form onSubmit={(e) => e.preventDefault()}>
				<SpaceBetween direction="vertical" size="xxl">
					<Form
						actions={
							<SpaceBetween direction="horizontal" size="xxl">
								<Button
									formAction="none"
									variant="link"
									onClick={(e) => navigate("/translation/history")}
								>
									{t("generic_cancel")}
								</Button>
								<Button variant="primary" onClick={submit}>
									{t("generic_submit")}
								</Button>
							</SpaceBetween>
						}
					>
						<SpaceBetween direction="vertical" size="xxl">
							<Container
								header={
									<Header variant="h2">
										<FcFinePrint />
										&nbsp;{t("generic_create_new")}
									</Header>
								}
							>
								<SpaceBetween direction="vertical" size="xs">
									<Grid
										gridDefinition={[
											{ colspan: { default: 6, xxs: 6 } },
											{ colspan: { default: 6, xxs: 6 } },
										]}
									>
										<FormField stretch>
											<SpaceBetween direction="vertical" size="xxl">
												<Textarea
													onChange={(e) =>
														setTranslationTextInput(e.detail.value)
													}
													value={translationTextInput}
													rows={16}
													spellcheck
													autoFocus
												/>
											</SpaceBetween>
										</FormField>

										<FormField stretch>
											<SpaceBetween direction="vertical" size="xxl">
												<Textarea
													readOnly
													rows={16}
													value={translationTextOutput}
												/>
											</SpaceBetween>
										</FormField>
									</Grid>
									<Select
										selectedOption={{
											value: selectedTarget?.value,
											label: selectedTarget?.label,
										}}
										onChange={(e) =>
											onChangeLanguageSource({
												value: e.detail.selectedOption.value || "",
												label: e.detail.selectedOption.label || "",
											})
										}
										options={targets}
										filteringType="auto"
									/>
								</SpaceBetween>
							</Container>
						</SpaceBetween>
					</Form>
				</SpaceBetween>
			</form>
		</>
	);
}
