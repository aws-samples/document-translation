// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { API, Hub, Auth } from "aws-amplify";
import { CONNECTION_STATE_CHANGE, ConnectionState } from "@aws-amplify/pubsub";
import debug from "debug";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	ContentLayout,
	SpaceBetween,
	Header,
	Container,
	Grid,
	Box,
	Button,
} from "@cloudscape-design/components";

import ReadableViewDetails from "./viewDetails";
import ReadableViewEditText from "./viewEditText";
import ReadableViewEditImage from "./viewEditImage";
import { getPageJobId } from "../../util/getPageJobId";

const features = require("../../features.json");
let readableCreateJobItem = null;
let readableUpdateJobItem = null;
let readableGetJob = null;
let readableListModels = null;
let subscription_readableUpdateJobItem = null;
if (features.readable) {
	readableCreateJobItem = require('../../graphql/mutations').readableCreateJobItem
	readableUpdateJobItem = require('../../graphql/mutations').readableUpdateJobItem
	readableGetJob = require('../../graphql/queries').readableGetJob
	readableListModels = require('../../graphql/queries').readableListModels
	subscription_readableUpdateJobItem = require('../../graphql/subscriptions').readableUpdateJobItem
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

export default function ReadableNew() {
	const log = debug("app:Readable:View");
	const { t } = useTranslation();
	const [metadataState, setMetadataState] = useState({});
	const [textState, setTextState] = useState([]);
	const [imageState, setImageState] = useState({});
	const [modelState, setModelState] = useState(initialModelState);
	const [modelDefault, setModelDefault] = useState(initialModelDefault);
	const [priorConnectionState, setPriorConnectionState] = useState({});
	const CONNECTION_STATE_CHANGE = "CONNECTION_STATE_CHANGE";
	const ItemStatus = {
		PROCESSING: "processing",
		COMPLETED: "completed",
		UPDATED: "updated",
		GENERATE: "generate",
		FAILED_UNRECOGNISEDMODEL: "failed_unrecognisedModel",
	};
	const ItemValues = {
		TEXT: "text",
		IMAGE: "image",
		METADATA: "metadata",
	};
	const ItemKeys = {
		CREATEDAT: "createdAt",
		ID: "id",
		IDENTITY: "identity",
		INPUT: "input",
		ITEMID: "itemId",
		MODELID: "modelId",
		NAME: "name",
		ORDER: "order",
		OUTPUT: "output",
		PARENT: "parent",
		STATUS: "status",
		TYPE: "type",
		UPDATEDAT: "updatedAt",
	};
	const LoadingStatus = [ItemStatus.GENERATE, ItemStatus.PROCESSING];

	useEffect(() => {
		log("Logging enabled");
	}, []);

	// UTIL
	function returnObjectWithItemId(allItems, itemId) {
		return allItems.find((item) => item.itemId === itemId);
	}

	function returnArrayOfType(allObjects, typeToReturn) {
		const result = [];
		allObjects.map((object) => {
			if (object.type === typeToReturn) {
				result.push(object);
			}
		});
		return result;
	}

	function orderArrayByKey(array, key) {
		return array.sort((a, b) => {
			if (a[key] < b[key]) {
				return -1;
			}
			if (a[key] > b[key]) {
				return 1;
			}
			return 0;
		});
	}

	// #region // MODELS
	// MODELS | FETCH
	async function listModels() {
		try {
			return await API.graphql({
				query: readableListModels,
				authMode: "AMAZON_COGNITO_USER_POOLS",
			});
		} catch (error) {
			console.log("Error fetching models:", error);
		}
	}

	function createModelsSelectionInput(modelState) {
		return modelState.map((model) => {
			return {
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

	function findDefaultModelId(modelState, index) {
		return modelState[index].value;
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

	async function setModelData() {
		const result = await listModels();
		const allModels = result.data.readableListModels.items;

		const textModels = returnArrayOfType(allModels, ItemValues.TEXT);
		setModelDataOfType(textModels, ItemValues.TEXT);

		const imageModels = returnArrayOfType(allModels, ItemValues.IMAGE);
		setModelDataOfType(imageModels, ItemValues.IMAGE);
	}

	useEffect(() => {
		setModelData();
	}, []);

	// #endregion // MODELS

	//
	// #region // JOB

	// JOB | FETCH
	async function fetchAllJobItems() {
		try {
			return await API.graphql({
				query: readableGetJob,
				authMode: "AMAZON_COGNITO_USER_POOLS",
				variables: {
					id: getPageJobId(),
				},
			});
		} catch (error) {
			console.log("Error fetching job:", error);
		}
	}

	function createItemStateForType(setState, data, type) {
		const itemsOfType = returnArrayOfType(data, type);
		const orderedItems = orderArrayByKey(itemsOfType, ItemKeys.ORDER);

		if (type === ItemValues.IMAGE) {
			const groupedItems = groupItemsByParent(orderedItems);
			setState(groupedItems);
		} else {
			setState(orderedItems);
		}
	}

	function groupItemsByParent(items) {
		const groupedItems = {};
		items.forEach((item) => {
			groupedItems[item.parent] = groupedItems[item.parent] || [];
			groupedItems[item.parent].push(item);
		});
		return groupedItems;
	}

	async function fetchInitialStates() {
		const result = await fetchAllJobItems();
		const allItems = result.data.readableGetJob.items;
		// METADATA
		const metatdataItem = returnObjectWithItemId(allItems, ItemValues.METADATA);
		setMetadataState(metatdataItem);
		// TEXT & IMAGE
		createItemStateForType(setTextState, allItems, ItemValues.TEXT);
		createItemStateForType(setImageState, allItems, ItemValues.IMAGE);
	}

	useEffect(() => {
		fetchInitialStates();
	}, []);

	useEffect(() => {
		console.log("textState", textState);
		console.log("imageState", imageState);
	}, [textState, imageState]);

	// #endregion // JOB

	// // #region // SUBSCRIBE

	function ifSubscriptionConnectionStateChange(payload) {
		return (
			payload.event === CONNECTION_STATE_CHANGE &&
			priorConnectionState.current === ConnectionState.Connecting &&
			payload.data.connectionState === ConnectionState.Connected
		);
	}
	function handleConnectionChangesFromApi() {
		Hub.listen("api", (data) => {
			log("handleConnectionChangesFromApi data", data);
			const payload = data.payload;
			if (ifSubscriptionConnectionStateChange(payload)) {
				fetchInitialStates();
				priorConnectionState.current = payload.data.connectionState;
			}
		});
	}

	function subscriptionRequest() {
		log("subscriptionRequest metadataState", metadataState);
		try {
			return API.graphql({
				query: subscription_readableUpdateJobItem,
				authMode: "AMAZON_COGNITO_USER_POOLS",
				// variables: { id: metadataState.id },
				variables: { id: getPageJobId() },
			});
		} catch (error) {
			console.log("Error fetching subscription:", error);
		}
	}

	function setNewTextStateValues(newItem, possibleKeys) {
		setTextState((prevState) => {
			const newState = [...prevState];
			const itemIndex = newState.findIndex(
				(stateItem) => stateItem.itemId === newItem.itemId
			);

			if (itemIndex === -1) {
				newState.push({ itemId: newItem.itemId });
			} else {
				possibleKeys.forEach((key) => {
					if (newItem[key]) {
						newState[itemIndex][key] = newItem[key];
					}
				});
			}
			return newState;
		});
	}


	function setNewImageStateValues(newItem, possibleKeys) {
		setImageState((prevState) => {
			console.log("setNewImageStateValues newItem", newItem);
			const parentId = newItem.parent;
			console.log("setNewImageStateValues parentId", parentId);
			const newState = { ...prevState };

			// Create an empty parent if it doesn't exist yet.
			if (!newState[parentId]) {
				newState[parentId] = [];
			}

			// Find the udpated item within the state.
			const stateNestedItemIndex = newState[parentId].findIndex(
				(stateItem) => stateItem.itemId === newItem.itemId
			);

			// If the item was not found, push the whole tiem
			// Else iterate the update values
			if (stateNestedItemIndex === -1) {
				newState[parentId].push(newItem);
			} else {
				possibleKeys.forEach((key) => {
					if (newItem[key]) {
						// if (key === "status") {
						// 	console.log("setNewImageStateValues mewItem key", key);
						// 	console.log("setNewImageStateValues newState before", newState);
						// 	console.log("setNewImageStateValues newState a1", parentId);
						// 	console.log(
						// 		"setNewImageStateValues newState a2",
						// 		newState[parentId]
						// 	);
						// 	console.log(
						// 		"setNewImageStateValues newState b1",
						// 		stateNestedItemIndex
						// 	);
						// 	console.log(
						// 		"setNewImageStateValues newState b2",
						// 		newState[parentId][stateNestedItemIndex]
						// 	);
						// 	console.log("setNewImageStateValues newState c1", key);
						// 	console.log(
						// 		"setNewImageStateValues newState c2",
						// 		newState[parentId][stateNestedItemIndex][key]
						// 	);
						// }
						newState[parentId][stateNestedItemIndex][key] = newItem[key];
						// if (key === "status") {
						// 	console.log("setNewImageStateValues newState after", newState);
						// }
					}
				});
			}
			return newState;
		});
	}

	function setNewMetadataStateValues(newItem, possibleKeys) {
		setMetadataState((prevState) => {
			const newState = { ...prevState };
			const itemIndex = newState.findIndex(
				(stateItem) => stateItem.itemId === ItemValues.METADATA
			);
			possibleKeys.forEach((key) => {
				if (newItem[key]) {
					newState[itemIndex][key] = newItem[key];
				}
			});
			return newState;
		});
	}

	function handleNewDataFromSubscription(item) {
		console.log("handleNewDataFromSubscription item", item);
		const possibleUpdateKeysForItems = [
			ItemKeys.UPDATEDAT,
			ItemKeys.STATUS,
			ItemKeys.OUTPUT,
		];
		const possibleUpdateKeysForMetadata = ["name"];
		if (item.type === ItemValues.TEXT) {
			setNewTextStateValues(item, possibleUpdateKeysForItems);
		} else if (item.type === ItemValues.IMAGE) {
			setNewImageStateValues(item, possibleUpdateKeysForItems);
		} else if (item.itemId === ItemValues.METADATA) {
			setNewMetadataStateValues(item, possibleUpdateKeysForMetadata);
		} else {
			console.log(
				"handleNewDataFromSubscription item.type not determined",
				item
			);
		}
	}

	function createSubscription() {
		debugger;
		return subscriptionRequest().subscribe({
			next: ({ value }) => {
				const newData = value.data.readableUpdateJobItem;
				handleNewDataFromSubscription(newData);
			},
			error: (error) => {
				error.error.errors.forEach((e) => {
					console.error(e.message);
				});
			},
		});
	}

	useEffect(() => {
		handleConnectionChangesFromApi();
		const subscription = createSubscription();
		// return () => subscription.unsubscribe();
	}, []);

	// #endregion // SUBSCRIBE

	// APPEND NEW ITEM
	// APPEND NEW ITEM | TEXT
	// function appendTextItemToState(item) {
	// 	setItems([...items, item]);
	// }

	async function createNewTextItem(order) {
		const credentials = await Auth.currentUserCredentials();
		const identity = credentials.identityId;
		try {
			const result = await API.graphql({
				query: readableCreateJobItem,
				authMode: "AMAZON_COGNITO_USER_POOLS",
				variables: {
					id: metadataState.id,
					order: order,
					identity: identity,
					type: ItemValues.TEXT,
				},
			});
			return await result.data.readableCreateJobItem;
		} catch (error) {
			console.log("Error creating text item:", error);
		}
	}

	async function createNewImageItem(parentId, order) {
		const credentials = await Auth.currentUserCredentials();
		const identity = credentials.identityId;
		try {
			const result = await API.graphql({
				query: readableCreateJobItem,
				authMode: "AMAZON_COGNITO_USER_POOLS",
				variables: {
					id: metadataState.id,
					order: order,
					identity: identity,
					type: ItemValues.IMAGE,
					parent: parentId,
				},
			});
			return await result.data.readableCreateJobItem;
		} catch (error) {
			console.log("Error creating text item:", error);
		}
	}

	async function pushItemUpdateWithNewData(payload) {
		// TODO Move to util
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

	function updateNewTextItem(itemId) {
		pushItemUpdateWithNewData({
			id: metadataState.id,
			itemId: itemId,
			status: ItemStatus.UPDATED,
		});
	}
	function updateNewImageItem(itemId) {
		pushItemUpdateWithNewData({
			id: metadataState.id,
			itemId: itemId,
			status: ItemStatus.UPDATED,
		});
	}

	async function appendTextRow() {
		try {
			const newItemIndexOrder = textState.length;
			const newItem = await createNewTextItem(newItemIndexOrder);
			await updateNewTextItem(newItem.itemId);
			// appendTextItemToState(newItem);
		} catch (error) {
			console.log("Error appending text item:", error);
		}
	}
	async function appendImageRow(textItem, index) {
		let newItemIndexOrder = 0;
		const parentId = textItem.itemId;

		console.log("appendImageRow parentId", parentId);
		if (imageState[parentId]) {
			newItemIndexOrder = imageState[parentId].length;
		}

		try {
			const newItem = await createNewImageItem(parentId, newItemIndexOrder);
			updateNewImageItem(newItem.itemId);
			// appendTextItemToState(newItem);
		} catch (error) {
			console.log("Error appending text item:9 ", error);
		}
	}

	// DISPLAY
	// DISPLAY | HEADER
	function displayHeader() {
		return (
			<SpaceBetween size="m">
				<Header variant="h1" description={t("readable_description")}>
					{t("readable_view_title")}
				</Header>
			</SpaceBetween>
		);
	}

	// DISPLAY | HEADER
	function displayDetails() {
		return (
			<ReadableViewDetails
				metadataState={metadataState}
				setMetadataState={setMetadataState}
			/>
		);
	}
	// DISPLAY | TEXT ITEM
	function displayTextItem(item, index) {
		return (
			<ReadableViewEditText
				item={item}
				index={index}
				modelDefault={modelDefault}
				ItemKeys={ItemKeys}
				ItemValues={ItemValues}
				LoadingStatus={LoadingStatus}
				ItemStatus={ItemStatus}
				metadataState={metadataState}
				setTextState={setTextState}
				modelState={modelState}
				// items={items}
				// setItems={setItems}
				// models={models}
				// setModels={setIModels}
			/>
		);
	}
	// DISPLAY | IMAGE ITEM
	function displayImageItem(item, index, parentItem) {
		return (
			<ReadableViewEditImage
				item={item}
				index={index}
				LoadingStatus={LoadingStatus}
				modelDefault={modelDefault}
				modelState={modelState}
				// LoadingStatus={LoadingStatus}
				metadataState={metadataState}
				ItemStatus={ItemStatus}
				parentItem={parentItem}
				ItemValues={ItemValues}
				ItemKeys={ItemKeys}
				setImageState={setImageState}
				// parentIndex={index}
				// appendImageRow={appendImageRow}
				// images={item.images}
			/>
		);
	}
	// DISPLAY | ADD ROW
	function displayAddTextRow() {
		return (
			<>
				<Box variant="div" textAlign="center">
					<Button
						iconName="insert-row"
						variant="link"
						onClick={() => appendTextRow()}
					>
						{t("generic_add_new_row")}
					</Button>
				</Box>
			</>
		);
	}
	function displayAddImageRow(textItem, index) {
		return (
			<>
				<Box variant="div">
					<Button
						iconName="zoom-to-fit"
						variant="link"
						onClick={() => appendImageRow(textItem, index)}
					>
						{t("generic_add_new_image")}
					</Button>
				</Box>
			</>
		);
	}

	return (
		<>
			<ContentLayout header={displayHeader()}>
				<SpaceBetween size="xxl">
					{displayDetails()}
					<SpaceBetween size="xl">
						{textState &&
							textState.map((textItem, index) => (
								<SpaceBetween key={textItem.itemId} size="xl">
									<Container>
										<SpaceBetween key={index} size="xl">
											{displayTextItem(textItem, index)}
											<hr />
											{imageState && (
												<Grid>
													{imageState[textItem.itemId] &&
														imageState[textItem.itemId].map(
															(imageItem, index) => (
																<Box key={imageItem.itemId} variant="div">
																	{displayImageItem(imageItem, index, textItem)}
																</Box>
															)
														)}
													<Box margin="xxl" variant="div">
														{displayAddImageRow(textItem, index)}
													</Box>
												</Grid>
											)}
										</SpaceBetween>
										<span className="jobId">{textItem.itemId}</span>
									</Container>
								</SpaceBetween>
							))}
					</SpaceBetween>
					{displayAddTextRow()}
				</SpaceBetween>
			</ContentLayout>
		</>
	);
}