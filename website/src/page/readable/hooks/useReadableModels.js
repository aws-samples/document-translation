// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect } from "react";
import { API } from "aws-amplify";
import { ItemValues } from "../enums";

const features = require("../../../features.json");
const readableListModels = features.readable
	? require("../../../graphql/queries").readableListModels
	: null;

export const UseReadableModels = () => {
	const [modelState, setModelState] = useState({
		text: [],
		image: [],
	});
	const [modelDefault, setModelDefault] = useState({
		text: null,
		image: null,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	function createModelsSelectionInput(modelState) {
		return modelState.map((model, index) => {
			return {
				key: index,
				label: model.name,
				value: model.id,
				default: model.default,
				iconName: model.default ? "star" : undefined,
			};
		});
	}

	function findIndexOfDefault(array) {
		return array.findIndex((item) => item.default);
	}

	function findDefaultModelId(array, index) {
		return array[index].value;
	}

	function setModelDataOfType(modelState, modelType) {
		const selectionInput = createModelsSelectionInput(modelState);
		setModelState((prevModels) => {
			return {
				...prevModels,
				[modelType]: selectionInput,
			};
		});

		const defaultModelIndex = findIndexOfDefault(selectionInput);
		const defaultModelId = findDefaultModelId(
			selectionInput,
			defaultModelIndex
		);
		setModelDefault((prevModelDefault) => {
			return {
				...prevModelDefault,
				[modelType]: {
					index: defaultModelIndex,
					id: defaultModelId,
				},
			};
		});
	}

	useEffect(() => {
		const fetchModels = async () => {
			try {
				const result = await API.graphql({
					query: readableListModels,
					authMode: "AMAZON_COGNITO_USER_POOLS",
				});
				const allModels = result.data.readableListModels.items;
				const textModels = allModels.filter(
					(model) => model.type === ItemValues.TEXT
				);
				const imageModels = allModels.filter(
					(model) => model.type === ItemValues.IMAGE
				);

				setModelDataOfType(textModels, ItemValues.TEXT);
				setModelDataOfType(imageModels, ItemValues.IMAGE);

				setLoading(false);
			} catch (error) {
				console.log("Error fetching models:", error);
				setError(error);
				setLoading(false);
			}
		};

		fetchModels();
	}, []);

	return { modelState, modelDefault, loading, error };
};
