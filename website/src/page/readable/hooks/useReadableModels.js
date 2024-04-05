// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect } from "react";
import { API } from "aws-amplify";

import { ItemValues } from "../enums";

const features = require("../../../features.json");
let readableListModels = null;
if (features.readable) {
	readableListModels = require('../../../graphql/queries').readableListModels
} 

const initialModelState = {
	text: [],
	image: [],
};
const initialModelDefault = {
	text: {
		index: 0,
	},
	image: {
		index: 0,
	},
};


export const UseReadableModels = () => {
    const [modelState, setModelState] = useState(initialModelState);
	const [modelDefault, setModelDefault] = useState(initialModelDefault);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    function returnArrayOfType(allObjects, typeToReturn) {
        return allObjects.filter((object) => object.type === typeToReturn);
    }

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
                const textModels = returnArrayOfType(allModels, ItemValues.TEXT);
                const imageModels = returnArrayOfType(allModels, ItemValues.IMAGE);

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