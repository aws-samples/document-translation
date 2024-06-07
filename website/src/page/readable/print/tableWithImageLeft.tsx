// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import { useEffect, useState } from "react";

import { getPresignedUrl } from "../../../util/getPresignedUrl";

import { S3KeyTypes } from "../../../enums";

function DisplayText({ text }) {
	if (!text) {
		return null;
	}

	const lines = text.split("\n").filter((line) => line.trim());

	return (
		<div>
			{lines.map((line) => (
				<p key={line}>{line}</p>
			))}
		</div>
	);
}

function SingleImage(props) {
	const [imageUrl, setImageUrl] = useState(null);
	useEffect(() => {
		const asyncGetPresignedUrl = async () => {
			const url = await getPresignedUrl({
				key: props.imageKey,
				keyType: S3KeyTypes.SCOPE_USER_OBJECT,
				bucketKey: "awsReadableS3Bucket",
			});
			setImageUrl(url);
		};

		if (props.imageKey) {
			asyncGetPresignedUrl();
		}
	}, [props.imageKey]);

	return (
		<td>
			<div>{props.imageKey && <img src={imageUrl} alt={`Generated`} />}</div>
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
	return (
		<tr>
			<SingleImage key={props.key} imageKey={props.imageKey} />
			<SingleText key={props.key} text={props.text} />
		</tr>
	);
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
