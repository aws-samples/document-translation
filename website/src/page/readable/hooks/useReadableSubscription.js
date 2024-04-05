// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect } from "react";
import { API, Hub } from "aws-amplify";
import { ConnectionState } from "@aws-amplify/pubsub";
import debug from "debug";
import { getPageJobId } from "../../../util/getPageJobId";
import { ItemValues, ItemKeys } from "../enums";

const features = require("../../../features.json");
let subscription_readableUpdateJobItem = null;
let readableGetJob = null;

if (features.readable) {
	subscription_readableUpdateJobItem =
		require("../../../graphql/subscriptions").readableUpdateJobItem;
	readableGetJob = require("../../../graphql/queries").readableGetJob;
}

const CONNECTION_STATE_CHANGE = "CONNECTION_STATE_CHANGE";

export const UseReadableSubscription = (
	setMetadataState,
	setTextState,
	setImageState
) => {
	const log = debug("app:Readable:View:Subscription");
	const [priorConnectionState] = useState({});

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
			try {
				return API.graphql({
					query: subscription_readableUpdateJobItem,
					authMode: "AMAZON_COGNITO_USER_POOLS",
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
							newState[parentId][stateNestedItemIndex][key] = newItem[key];
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

		handleConnectionChangesFromApi();
		createSubscription();

		return () => {
			// Unsubscribe logic
		};
	}, [setMetadataState, setTextState, setImageState]);
};
