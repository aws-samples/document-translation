// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Amplify, API, Auth, Storage } from "aws-amplify";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	Button,
	Box,
	SpaceBetween,
	Select,
} from "@cloudscape-design/components";

const features = require("../../features.json");
let readableUpdateJobItem = null;
if (features.readable) {
	readableUpdateJobItem =
		require("../../graphql/mutations").readableUpdateJobItem;
}

// CONFIGURE
// CONFIGURE | AMPLIFY
const cfnOutputs = require("../../cfnOutputs.json");

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
			API.graphql({
				query: readableUpdateJobItem,
				authMode: "AMAZON_COGNITO_USER_POOLS",
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
			const credentials = await Auth.currentUserCredentials();
			const userPrefix = "private/" + credentials.identityId + "/";
			const downloadKey = key.replace(userPrefix, "");

			const signedURL = await Storage.get(downloadKey, {
				level: "private",
				expires: 120,
				region: cfnOutputs.awsRegion,
				bucket: cfnOutputs.awsReadableS3Bucket,
			});

			setImageUrl(signedURL);
		} catch (error) {
			console.log("error: ", error);
		}
	}
	useEffect(() => {
		if (!props.item.output) return;
		imageKeyHandler(props.item.output);
	}, [props.item.output]);

	function isMultipleModelOptions(type) {
		if (
			props.modelState &&
			props.modelState[type] &&
			props.modelState[type].length > 1
		) {
			return true;
		}
		return false;
	}

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
							alt={`Placeholder image`}
						/>
					)}
					{props.item.output && (
						<>
							{imageUrl && (
								<>
									<img
										className="borderRadius generatedImage"
										src={imageUrl}
										alt={`Generated image`}
									/>
								</>
							)}
						</>
					)}
				</Box>
				<Box variant="div">
					{isMultipleModelOptions(props.ItemValues.IMAGE) && (
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
						/>
					)}
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
