// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	Box,
	Button,
	Container,
	ContentLayout,
	Grid,
	Header,
	SpaceBetween,
	ButtonGroup,
} from "@cloudscape-design/components";

import { generateClient } from "@aws-amplify/api";
import { fetchAuthSession } from "@aws-amplify/auth";

import { UseReadableModels } from "./hooks/useReadableModels";
import { UseReadableSubscription } from "./hooks/useReadableSubscription";
import ReadableViewUpload from "./viewUpload";

import { ItemKeys, ItemStatus, ItemValues } from "./enums";
import ReadableViewDetails from "./viewDetails";
import ReadableViewEditImage from "./viewEditImage";
import ReadableViewEditText from "./viewEditText";
import ReadableViewPreview from "./viewPreview";
import ReadableViewPrintButton from "./viewPrintButton";

const client = generateClient({ authMode: "userPool" });

const features = require("../../features.json");
let readableCreateJobItem = null;
let readableUpdateJobItem = null;
if (features.readable) {
	readableCreateJobItem =
		require("../../graphql/mutations").readableCreateJobItem;
	readableUpdateJobItem =
		require("../../graphql/mutations").readableUpdateJobItem;
}

export default function ReadableNew() {
	const { t } = useTranslation();
	const [metadataState, setMetadataState] = useState({});
	const [textState, setTextState] = useState([]);
	const [imageState, setImageState] = useState({});
	const [itemViewState, setItemViewState] = useState({});

	const { modelState, modelDefault, loading, error } = UseReadableModels();
	const LoadingStatus = [ItemStatus.GENERATE, ItemStatus.PROCESSING];

	UseReadableSubscription(setMetadataState, setTextState, setImageState);

	if (error) {
		return (
			<div className="alert alert-danger" role="alert">
				{error}{" "}
				<a
					href="https://aws-samples.github.io/document-translation/docs/readable/post-install/models/"
					target="_blank"
					rel="noopener noreferrer"
				>
					Learn more
				</a>
			</div>
		);
	}

	// When an item with no, or empty, input exists default to edit view
	// this results in less clicks for the user particularly when adding a new row
	React.useEffect(() => {
		textState.forEach((textItem) => {
			const hasNoInputOrOutput = ! hasContent(textItem);
			const isNotLoading = !LoadingStatus.includes(textItem.status) && textItem.status;
			if (hasNoInputOrOutput && isNotLoading) {
				setItemViewState((prevState) => ({
					...prevState,
					[textItem.itemId]: { edit: true },
				}));
			}
		});
	}, [textState]);

	const hasContent = (textItem): boolean => {
		const hasInput = textItem.input || ! textItem.input === "";
		const hasOutput = textItem.output || ! textItem.output === "";
		return hasInput || hasOutput;
	}

	async function createNewTextItem(order) {
		const authSession = await fetchAuthSession();
		try {
			const result = await client.graphql({
				query: readableCreateJobItem,
				variables: {
					id: metadataState.id,
					order: order,
					identity: authSession.identityId,
					type: ItemValues.TEXT,
				},
			});
			return await result.data.readableCreateJobItem;
		} catch (error) {
			console.log("Error creating text item:", error);
		}
	}

	async function createNewImageItem(parentId, order) {
		const authSession = await fetchAuthSession();
		try {
			const result = await client.graphql({
				query: readableCreateJobItem,
				variables: {
					id: metadataState.id,
					order: order,
					identity: authSession.identityId,
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
			client.graphql({
				query: readableUpdateJobItem,
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

	async function handleMoveUp(index) {
		if (index > 0) {
			const newState = [...textState];
			[newState[index - 1], newState[index]] = [newState[index], newState[index - 1]];
			
			// Prepare batch updates for both items
			const batchMutations = `
				mutation BatchUpdateItems {
					item1: readableUpdateJobItem(
						id: "${metadataState.id}",
						itemId: "${newState[index - 1].itemId}",
						order: ${index - 1},
						status: "${ItemStatus.COMPLETED}"
					) {
						itemId
					}
					item2: readableUpdateJobItem(
						id: "${metadataState.id}",
						itemId: "${newState[index].itemId}",
						order: ${index},
						status: "${ItemStatus.COMPLETED}"
					) {
						itemId
					}
				}
			`;

			try {
				await client.graphql({
					query: batchMutations
				});
				setTextState(newState);
			} catch (error) {
				console.error("Error updating items:", error);
			}
		}
	}

	async function handleMoveDown(index) {
		if (index < textState.length - 1) {
			const newState = [...textState];
			[newState[index], newState[index + 1]] = [newState[index + 1], newState[index]];
			
			// Prepare batch updates for both items
			const batchMutations = `
				mutation BatchUpdateItems {
					item1: readableUpdateJobItem(
						id: "${metadataState.id}",
						itemId: "${newState[index].itemId}",
						order: ${index},
						status: "${ItemStatus.COMPLETED}"
					) {
						itemId
					}
					item2: readableUpdateJobItem(
						id: "${metadataState.id}",
						itemId: "${newState[index + 1].itemId}",
						order: ${index + 1},
						status: "${ItemStatus.COMPLETED}"
					) {
						itemId
					}
				}
			`;

			try {
				await client.graphql({
					query: batchMutations
				});
				setTextState(newState);
			} catch (error) {
				console.error("Error updating items:", error);
			}
		}
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
	function displayTextItem(item, index, totalItems) {
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
				totalItems={totalItems}
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
				metadataState={metadataState}
				ItemStatus={ItemStatus}
				parentItem={parentItem}
				ItemValues={ItemValues}
				ItemKeys={ItemKeys}
				setImageState={setImageState}
			/>
		);
	}
	// DISPLAY | ADD ROW
	function displayAddTextRow() {
		return (
			<>
				<Box variant="div" textAlign="center">
					<Button
						data-testid="readable-new-addrow-text"
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
						data-testid="readable-new-addrow-image"
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

	function displayItemView(textItem, index, totalItems) {
		if (itemViewState[textItem.itemId] && itemViewState[textItem.itemId].edit) {
			return displayItemEditView(textItem, index, totalItems);
		}
		return displayItemPreviewView(textItem, index);
	}
	function displayItemEditView(textItem, index, totalItems) {
		return (
			<>
				{displayTextItem(textItem, index, totalItems)}
				<hr />
				{imageState && (
					<Grid
						gridDefinition={[
							// If imageState[textItem.itemId] exists, create spans for all images plus add button
							// If it doesn't exist, create just one span for the add button
							...Array(imageState[textItem.itemId]?.length || 0).fill({ colspan: 4 }),
							{ colspan: 4 } // Add button span
						]}
					>
						{imageState[textItem.itemId]?.map((imageItem, index) => (
							<Box key={imageItem.itemId} variant="div">
								{displayImageItem(imageItem, index, textItem)}
							</Box>
						))}
						<Box margin="xxl" variant="div">
							{displayAddImageRow(textItem, index)}
						</Box>
					</Grid>
				)}
			</>
		);
	}
	function displayItemPreviewView(textItem, index) {
		return (
			<>
				<ReadableViewPreview
					text={textItem}
					image={
						imageState &&
						imageState[textItem.itemId] &&
						imageState[textItem.itemId][0]
					}
				/>
			</>
		);
	}

	function setViewState(id, value) {
		console.log("setChecked", id, value);
		setItemViewState({
			...itemViewState,
			[id]: {
				edit: value,
			},
		});
	}
	
	function copyStringToClipboard(str: string) {
		navigator.clipboard.writeText(str);
	}

	interface ItemClickDetails {
		checked?: boolean,
		id: string,
		pressed?: boolean,
	}

	function handleButtonGroup(detail: ItemClickDetails, itemId: string, index: number) {
		switch (detail.id) {
			case 'mode':
				setViewState(itemId, detail.pressed);
				return;
			case 'move-down':
				handleMoveDown(index);
				return;
			case 'move-up':
				handleMoveUp(index);
				return;
			case 'copy-itemId':
				copyStringToClipboard(itemId)
				return;
			case 'copy-output':
				copyStringToClipboard(textState[index].output)
				return;
			default:
				console.error("Unknown button group action", detail.id);
				return;
		}
	}

	function showRowFooter(textItem, index) {
		return (
			<Header
				actions={
					<ButtonGroup
						onItemClick={({ detail }) => handleButtonGroup(detail, textItem.itemId, index)}
						items={[
							{
								type: "group",
								text: t("generic_controls"),
								items: [
									{
										type: "icon-toggle-button",
										id: "mode",
										iconName: "edit",
										text: itemViewState[textItem.itemId]?.edit ? t("generic_view") : t("generic_edit"),
										popoverFeedback: t("generic_viewing"),
										pressedIconName: "transcript",
										pressed: itemViewState[textItem.itemId]?.edit || false,
										pressedPopoverFeedback: t("generic_editing"),
									},
									{
										type: "icon-button",
										id: "copy-output",
										iconName: "copy",
										text: t("generic_copy"),
									}
								]
							},
							{
								type: "menu-dropdown",
								id: "more-actions",
								text: t("generic_more_actions"),
								items: [
									{
										text: t("generic_move_row"),
										items: [
											{
												disabled: textItem.order === 0,
												iconName: "angle-up",
												id: `move-up`,
												text: t("generic_move_up"),
											},
											{
												id: `move-down`,
												disabled: textItem.order === textState.length - 1,
												iconName: "angle-down",
												text: t("generic_move_down"),
											},
										]
									},
									{
										text: t("generic_other"),
										items: [
											{
												id: "copy-itemId",
												iconName: "script",
												text: t("generic_copy_id"),
											},
										]
									}
								]
							}
						]}
						variant="icon"
					/>
				}
			>
			</Header>
		);
	};

	return (
		<>
			<ContentLayout header={displayHeader()}>
				<SpaceBetween size="xxl">
					{displayDetails()}
					<SpaceBetween size="xl">
						<ReadableViewPrintButton />
						{(!textState || textState.length === 0) ? (
							<ReadableViewUpload
								metadataState={metadataState} 
								setMetadataState={setMetadataState}
							/>
						) : (
							textState.map((textItem, index) => (
								<SpaceBetween key={textItem.itemId} size="xl">
									<Container
										footer={showRowFooter(textItem, index)}
									>
										{displayItemView(textItem, index, textState.length)}
									</Container>
								</SpaceBetween>
							)))}
					</SpaceBetween>
					{displayAddTextRow()}
				</SpaceBetween>
			</ContentLayout>
		</>
	);
}
