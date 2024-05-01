// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Auth, Storage } from "aws-amplify";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	Button,
	Box,
	SpaceBetween,
	Select,
} from "@cloudscape-design/components";
import {getPresignedUrl} from "./util/getPresignedUrl";
import { generateClient } from "aws-amplify/api";
const client = generateClient({ authMode: "userPool" });

const features = require("../../features.json");
let readableUpdateJobItem = null;
if (features.readable) {
	readableUpdateJobItem =
		require("../../graphql/mutations").readableUpdateJobItem;
}

// CONFIGURE
// CONFIGURE | AMPLIFY
// const cfnOutputs = require("../../c fnOutputs.json");

export default function ReadableViewEditImage(props) {
	const { t } = useTranslation();
	const [imageUrl, setImageUrl] = useState(null);

	// UTIL
	function isStatusLoading(status) {
		// TODO Move to utils
		return props.LoadingStatus.includes(status);
	}

	function returnItemModelIdOrDefault(type) {
		if (!props.item.modelId || props.item.modelId === "") {
			return props.modelDefault[type].id;
		} else {
			return props.item.modelId;
		}
	}

	async function pushItemUpdateWithNewData(payload) {
		try {
			client.graphql({
				query: readableUpdateJobItem,
				variables: payload,
			});
		} catch (error) {
			console.error(error);
			console.error("ERROR: " + error.errors[0].message);
		}
	}

	function generate() {
		pushItemUpdateWithNewData({
			id: props.metadataState.id,
			itemId: props.item.itemId,
			modelId: returnItemModelIdOrDefault("image"),
			input: props.parentItem.output,
			status: props.ItemStatus.GENERATE,
		});
	}

	// DOWNLOAD IMAGE
	async function imageKeyHandler(key) {
		try {
			const signedUrl = await getPresignedUrl(key)
			setImageUrl(signedUrl);
		} catch (error) {
			console.log("error: ", error);
		}
	}
	useEffect(() => {
		if (!props.item.output) return;
		imageKeyHandler(props.item.output);
	}, [props.item.output]);

	function returnIndexOfModelId(modelArray, modelId) {
		return modelArray.findIndex((model) => model.value === modelId);
	}

	function onChangeModel(value) {
		setItemsStateWithNewValue(props.ItemKeys.MODELID, value);
	}

	function setItemsStateWithNewValue(type, value) {
		props.setImageState((currentState) => {
			const newState = { ...currentState };
			newState[props.parentItem.itemId][props.index][type] = value;
			return newState;
		});
	}

	// DISPLAY COMPONENTS
	function displayImage() {
		const type = props.ItemValues.IMAGE;

		const models = props.modelState[type];

		const defaultModelIndex = props.modelDefault[type].index;

		const itemModelIndex = returnIndexOfModelId(models, props.item.modelId);

		return (
			<>
				<Box variant="div" textAlign="center">
					{!props.item.output && (
						<img
							className="borderRadius generatedImage"
							src="../../../image-placeholder.png"
							alt={`Placeholder`}
						/>
					)}
					{props.item.output && (
						<>
							{imageUrl && (
								<>
									<img
										className="borderRadius generatedImage"
										src={imageUrl}
										alt={`Generated`}
									/>
								</>
							)}
						</>
					)}
				</Box>
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
						options={props.modelState.image}
						filteringType="auto"
						disabled={props?.modelState?.image?.length < 2}
					/>
				</Box>
				<Box variant="div" textAlign="center">
					<Button
						iconName="angle-right-double"
						variant="link"
						onClick={() => generate()}
						loading={isStatusLoading(props.item.status)}
						// disabled={isTextInputUnsaved(index)}
					>
						{t("generic_generate")}
					</Button>
				</Box>
			</>
		);
	}

	return (
		<>
			<SpaceBetween size="xs">{displayImage()}</SpaceBetween>
		</>
	);
}
