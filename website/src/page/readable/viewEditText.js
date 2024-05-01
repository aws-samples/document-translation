// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import debug from "debug";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	Button,
	Textarea,
	Box,
	Grid,
	SpaceBetween,
	Select,
} from "@cloudscape-design/components";
import { generateClient } from "aws-amplify/api";
const client = generateClient({ authMode: "userPool" });
const features = require("../../features.json");
let readableUpdateJobItem = null;
if (features.readable) {
	readableUpdateJobItem =
		require("../../graphql/mutations").readableUpdateJobItem;
}

const initialFormState = [];

export default function ReadableViewEditText(props) {
	const log = debug("app:Readable:View:EditText");
	const { t } = useTranslation();
	const [formState, setFormState] = useState(initialFormState);

	// UTIL
	function isStatusLoading(status) {
		// TODO Move to utils
		return props.LoadingStatus.includes(status);
	}

	// // function setItemsStateStatus(index, newStatus) {
	// // 	props.setItems((currentState) => {
	// // 		const newState = [...currentState];
	// // 		newState[index].status = newStatus;
	// // 		return newState;
	// // 	});
	// // }

	// // function updateFormStateWithClearedSavedEdit(index, category, type) {
	// // 	updateFormStateWithEditStatus(index, category, type, false);
	// // }

	// function isTextInputUnsaved(index) {
	// 	return !(
	// 		formState?.[index]?.["input"]?.unsaved ||
	// 		formState?.[index]?.["modelId"]?.unsaved
	// 	);
	// }

	// function isTextOutputUnsaved(index) {
	// 	return !formState?.[index]?.["output"]?.unsaved;
	// }

	// // TEXT AREAS
	// // TEXT AREAS | INPUT
	// function updateFormStateWithTextEditStatus(index, type, status) {
	// 	setFormState((currentState) => {
	// 		const newState = [...currentState];
	// 		newState[index] = newState[index] ?? {};
	// 		newState[index][type] = newState[index][type] ?? {};
	// 		newState[index][type].unsaved = status;
	// 		return newState;
	// 	});
	// }

	function setItemsStateWithNewValue(type, value) {
		props.setTextState((currentState) => {
			const newState = [...currentState];
			newState[props.index][type] = value;
			return newState;
		});
	}

	function onChangeText(type, value) {
		// updateFormStateWithTextEditStatus(index, type, true);
		setItemsStateWithNewValue(type, value);
	}

	function returnIndexOfModelId(modelArray, modelId) {
		return modelArray.findIndex((model) => model.value === modelId);
	}

	function returnItemModelIdOrDefault() {
		if (!props.item.modelId || props.item.modelId === "") {
			return props.modelDefault.text.id;
		} else {
			return props.item.modelId;
		}
	}

	async function pushItemUpdateWithNewData(payload) {
		// TODO Move to util
		try {
			await client.graphql({
				query: readableUpdateJobItem,
				variables: payload,
			});
		} catch (error) {
			console.error(error);
			console.error("ERROR: " + error.errors[0].message);
		}
	}

	function generateText() {
		const payload = {
			id: props.metadataState.id,
			itemId: props.item.itemId,
			modelId: returnItemModelIdOrDefault(props.index),
			input: props.item.input,
			status: props.ItemStatus.GENERATE,
		};
		pushItemUpdateWithNewData(payload);
	}

	// // TEXT AREAS | OUTPUT
	function saveOutputTextManualEdit() {
		// setItemsStateStatus(index, statusValueCompleted);
		const payload = {
			id: props.metadataState.id,
			itemId: props.item.itemId,
			output: props.item.output,
			status: props.ItemStatus.UPDATED,
		};
		pushItemUpdateWithNewData(payload);
		// updateFormStateWithClearedSavedEdit(index, "text", "output");
	}

	// MODEL SELECTION
	function onChangeModel(value) {
		setItemsStateWithNewValue(props.ItemKeys.MODELID, value);
	}

	// DISPLAY COMPONENTS
	function displayInput() {
		const type = props.ItemValues.TEXT;
		const models = props.modelState[type];
		const defaultModelIndex = props.modelDefault[type].index;
		const itemModelIndex = returnIndexOfModelId(models, props.item.modelId);

		return (
			<>
				<Textarea
					onChange={({ detail }) =>
						onChangeText(props.ItemKeys.INPUT, detail.value)
					}
					value={props.item.input}
					placeholder={t("readable_view_input_text_placeholder")}
					spellcheck
					rows={10}
				/>
				<Box variant="div">
					<Select
						selectedOption={
							props.item.modelId
								? models[itemModelIndex]
								: models[defaultModelIndex]
						}
						onChange={({ detail }) =>
							onChangeModel(detail.selectedOption.value)
						}
						options={props.modelState.text}
						filteringType="auto"
						disabled={props?.modelState?.text?.length < 2}
					/>
				</Box>

				<Box variant="div" textAlign="center">
					<Button
						iconName="angle-right-double"
						variant="link"
						onClick={() => generateText()}
						loading={isStatusLoading(props.item.status)}

						// disabled={isTextInputUnsaved(index)}
					>
						{t("generic_generate")}
					</Button>
				</Box>
			</>
		);
	}

	function displayOutput() {
		return (
			<>
				<Textarea
					onChange={({ detail }) => onChangeText("output", detail.value)}
					value={props.item.output}
					placeholder={t("readable_view_output_text_placeholder")}
					spellcheck
					rows={12}
				/>
				<Box variant="div" textAlign="center">
					<Button
						iconName="upload"
						variant="link"
						onClick={({ detail }) => saveOutputTextManualEdit(detail.value)}
						loading={isStatusLoading(props.item.status)}
						// disabled={isTextOutputUnsaved(index)}
					>
						{t("generic_save")}
					</Button>
				</Box>
			</>
		);
	}

	return (
		<>
			<Grid gridDefinition={[{ colspan: 4 }, { colspan: 8 }]}>
				<Box variant="div">
					<SpaceBetween size="xs">{displayInput()}</SpaceBetween>
				</Box>
				<Box variant="div">
					<SpaceBetween size="xs">{displayOutput()}</SpaceBetween>
				</Box>
			</Grid>
		</>
	);
}
