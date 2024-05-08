// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import { useEffect, useState } from "react";

import { Box, Grid } from "@cloudscape-design/components";

import { getPresignedUrl } from "./util/getPresignedUrl";

import { S3KeyTypes } from "../../enums";

export default function ReadableViewPreview(props) {
	const [imageUrl, setImageUrl] = useState(null);

	useEffect(() => {
		const asyncGetPresignedUrl = async () => {
			const url = await getPresignedUrl({
				key: props.image.output,
				keyType: S3KeyTypes.SCOPE_USER_OBJECT,
			});
			setImageUrl(url);
		};

		if (props?.image?.output) {
			asyncGetPresignedUrl();
		}
	}, [props?.image?.output]);

	return (
		<>
			<Grid gridDefinition={[{ colspan: 4 }, { colspan: 8 }]}>
				{imageUrl && (
					<img
						className="borderRadius generatedImage"
						src={imageUrl}
						alt={`Generated`}
					/>
				)}
				{!imageUrl && <div></div>}
				<Box data-whitespace="preserve" variant="div">
					{props?.text?.output}
				</Box>
			</Grid>
		</>
	);
}
