// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useEffect, useState } from "react";

import { generateClient } from "@aws-amplify/api";

import { ItemValues } from "../enums";

const client = generateClient({ authMode: "userPool" });

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
		const indexOfDefault = array.findIndex((item) => item.default);
		if (indexOfDefault === -1) {
			return 0;
		} else {
			return indexOfDefault;
		}
	}

	function findDefaultModelId(array, index) {
		return array[index].value;
	}

	useEffect(() => {
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

		const fetchModels = async () => {
			try {
				const result = await client.graphql({
					query: readableListModels,
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
