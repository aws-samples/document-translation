// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useEffect, useState } from "react";
import { Auth, Storage } from "aws-amplify";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import { Grid, Box } from "@cloudscape-design/components";

const features = require("../../features.json");
let readableUpdateJobItem = null;
if (features.readable) {
	readableUpdateJobItem = require('../../graphql/mutations').readableUpdateJobItem;
} 

// CONFIGURE
// CONFIGURE | AMPLIFY
const cfnOutputs = require("../../cfnOutputs.json");

export default function ReadableViewPreview(props) {
	const [imageUrl, setImageUrl] = useState(null);

	// DOWNLOAD IMAGE
	async function imageKeyHandler(key) {
		try {
			const credentials = await Auth.currentUserCredentials();
			const userPrefix = "private/" + credentials.identityId + "/";
			const downloadKey = key.replace(userPrefix, "");

			const signedURL = await Storage.get(downloadKey, {
				level: "private",
				expires: 120,
				region: cfnOutputs.awsRegion,
				bucket: cfnOutputs.awsReadableS3Bucket,
			});

			setImageUrl(signedURL);
		} catch (error) {
			console.log("error: ", error);
		}
	}
	useEffect(() => {
		if (!props.image) return;
		if (!props.image.output) return;
		imageKeyHandler(props.image.output);
	}, [props.image]);

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
					{!imageUrl && (
						<div></div>
					)}
					<Box data-whiteSpace="preserve" variant="div">
						{props.text.output}
					</Box>
				</Grid>
			</>
	);
}