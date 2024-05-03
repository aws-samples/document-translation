// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
	Toggle,
} from "@cloudscape-design/components";

import { ItemValues, ItemStatus, ItemKeys } from "./enums";
import { UseReadableModels } from "./hooks/useReadableModels";
import { UseReadableSubscription } from "./hooks/useReadableSubscription";
import ReadableViewDetails from "./viewDetails";
import ReadableViewEditText from "./viewEditText";
import ReadableViewEditImage from "./viewEditImage";
import ReadableViewPreview from "./viewPreview";
import ReadableViewPrintButton from "./viewPrintButton";

import { fetchAuthSession } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
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
	const log = debug("app:Readable:View");
	const { t } = useTranslation();
	const [metadataState, setMetadataState] = useState({});
	const [textState, setTextState] = useState([]);
	const [imageState, setImageState] = useState({});
	const [itemViewState, setItemViewState] = useState({});

	const { modelState, modelDefault } = UseReadableModels();
	const LoadingStatus = [ItemStatus.GENERATE, ItemStatus.PROCESSING];

	UseReadableSubscription(setMetadataState, setTextState, setImageState);

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

	function displayItemView(textItem, index) {
		if (itemViewState[textItem.itemId] && itemViewState[textItem.itemId].edit) {
			return displayItemEditView(textItem, index);
		}
		return displayItemPreviewView(textItem, index);
	}
	function displayItemEditView(textItem, index) {
		return (
			<>
				{displayTextItem(textItem, index)}
				<hr />
				{imageState && (
					<Grid>
						{imageState[textItem.itemId] &&
							imageState[textItem.itemId].map((imageItem, index) => (
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

	return (
		<>
			<ContentLayout header={displayHeader()}>
				<SpaceBetween size="xxl">
					{displayDetails()}
					<SpaceBetween size="xl">
						<ReadableViewPrintButton />
						{textState &&
							textState.map((textItem, index) => (
								<SpaceBetween key={textItem.itemId} size="xl">
									<Container>
										<SpaceBetween key={index} size="xl">
											<Toggle
												onChange={({ detail }) =>
													setViewState(textItem.itemId, detail.checked)
												}
												checked={
													itemViewState[textItem.itemId] &&
													itemViewState[textItem.itemId].edit
														? itemViewState[textItem.itemId].edit
														: false
												}
											>
												{t("generic_edit")}
											</Toggle>
											{displayItemView(textItem, index)}
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
