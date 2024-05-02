// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect } from "react";
import { getPageJobId } from "../../../util/getPageJobId";
import { ItemValues, ItemKeys } from "../enums";

import { orderArrayByKey } from "../../../util/orderArrayByKey";
import { returnArrayOfType } from "../../../util/returnArrayOfType";
import {groupItemsByParent } from  "../util/groupItemsByParent";

import { Hub } from 'aws-amplify/utils';
import { generateClient,  CONNECTION_STATE_CHANGE, ConnectionState } from 'aws-amplify/api';
const client = generateClient({ authMode: "userPool" });

const features = require("../../../features.json");
let subscription_readableUpdateJobItem = null;
let readableGetJob = null;

if (features.readable) {
	subscription_readableUpdateJobItem =
		require("../../../graphql/subscriptions").readableUpdateJobItem;
	readableGetJob = require("../../../graphql/queries").readableGetJob;
}

export const UseReadableSubscription = (
	setMetadataState,
	setTextState,
	setImageState
) => {
	const [priorConnectionState] = useState({});

	// UTIL
	async function fetchAllJobItems() {
		try {
			return await client.graphql({
				query: readableGetJob,
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

	async function fetchInitialStates() {
		const result = await fetchAllJobItems();
		const allItems = result.data.readableGetJob.items;
		// METADATA
		const metatdataItem = allItems.find((item) => item.itemId === ItemValues.METADATA);
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
				const payload = data.payload;
				if (ifSubscriptionConnectionStateChange(payload)) {
					fetchInitialStates();
					priorConnectionState.current = payload.data.connectionState;
				}
			});
		}

		function subscriptionRequest() {
			try {
				return client.graphql({
					query: subscription_readableUpdateJobItem,
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
