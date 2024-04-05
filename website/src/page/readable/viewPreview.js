// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import "@cloudscape-design/global-styles/index.css";
import { Grid, Box } from "@cloudscape-design/components";
import { useGetPresignedUrl } from "./hooks/useGetPresignedUrl";

export default function ReadableViewPreview(props) {
	const imageUrl = useGetPresignedUrl(props.image?.output);

	return (
		<>
			<Grid gridDefinition={[{ colspan: 4 }, { colspan: 8 }]}>
				{imageUrl && (
					<img
						className="borderRadius generatedImage"
						src={imageUrl}
						alt={`Generated image`}
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
