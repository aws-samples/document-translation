// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import "@cloudscape-design/global-styles/index.css";
import { getPresignedUrl } from "../util/getPresignedUrl";
import { S3KeyTypes } from "../../../enums";

function DisplayText({ text }) {
	const lines = text.split("\n").filter((line) => line.trim());

	return (
		<div>
			{lines.map((line) => (
				<p key={line}>{line}</p>
			))}
		</div>
	);
}

async function SingleImage(props) {
	const imageUrl = await getPresignedUrl({
		key: props.imageKey,
		keyType: S3KeyTypes.SCOPE_USER_OBJECT,
	});

	return (
		<td>
			<div>
				{props.imageKey && <img src={imageUrl} alt={`Generated image`} />}
			</div>
		</td>
	);
}
function SingleText(props) {
	return (
		<td>
			<div>
				<DisplayText text={props.text} />
			</div>
		</td>
	);
}

function SingleRow(props) {
	// if props.key is an odd number
	if (props.key % 2 === 1) {
		return (
			<tr>
				<SingleImage key={props.key} imageKey={props.imageKey} />
				<SingleText key={props.key} text={props.text} />
			</tr>
		);
	} else {
		return (
			<tr>
				<SingleText key={props.key} text={props.text} />
				<SingleImage key={props.key} imageKey={props.imageKey} />
			</tr>
		);
	}
}

export function ReadablePrintPreview(props) {
	return (
		<>
			<table>
				<tbody>
					{props.textState?.map((textItem, index) => (
						<SingleRow
							key={index}
							text={textItem.output}
							imageKey={props.imageState[textItem.itemId]?.[0]?.output || null}
						/>
					))}
				</tbody>
			</table>
		</>
	);
}

export default ReadablePrintPreview;
