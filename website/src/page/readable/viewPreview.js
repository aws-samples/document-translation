// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import "@cloudscape-design/global-styles/index.css";
import { Grid, Box } from "@cloudscape-design/components";
import { getPresignedUrl } from "./util/getPresignedUrl";
import { S3KeyTypes } from "../../enums";

export default async function ReadableViewPreview(props) {
	const imageUrl = await getPresignedUrl({
		key: props.image?.output,
		keyType: S3KeyTypes.SCOPE_USER_OBJECT,
	});

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
					{props.text.output}
				</Box>
			</Grid>
		</>
	);
}
