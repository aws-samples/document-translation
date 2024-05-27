// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useEffect, useState } from "react";

import { applyMode, Mode } from "@cloudscape-design/global-styles";

import { generateClient } from "@aws-amplify/api";

import { sharedUpdatePreferences } from "../graphql/mutations";
import { sharedGetPreferences } from "../graphql/queries";

import { VisualMode, VisualModes } from "../enums";

export function useVisualMode() {
	const [visualMode, setVisualMode] = useState<VisualMode | undefined>(
		undefined
	);

	useEffect(() => {
		async function getPreferences() {
			const client = generateClient({ authMode: "userPool" });
			try {
				const result = await client.graphql({
					query: sharedGetPreferences,
				});
				const mode = result.data.sharedGetPreferences.visualMode;
				if (mode) {
					setVisualMode(mode);
				} else {
					console.log("Error fetching preferences: visualMode does not exist.");
				}
			} catch (error) {
				console.log("Error fetching preferences:", error);
			}
		}
		getPreferences();
	}, []);

	useEffect(() => {
		const applyPreferences = () => {
			if (visualMode === VisualModes.DARK) {
				applyMode(Mode.Dark);
			} else if (visualMode === VisualModes.LIGHT) {
				applyMode(Mode.Light);
			} else {
				window
					.matchMedia("(prefers-color-scheme: dark)")
					.addEventListener("change", (e) => {
						if (e.matches) {
							applyMode(Mode.Dark);
						} else {
							applyMode(Mode.Light);
						}
					});
			}
		};
		applyPreferences();
	}, [visualMode]);

	useEffect(() => {
		if (visualMode) {
			async function savePreferences() {
				const client = generateClient({ authMode: "userPool" });
				try {
					const result = await client.graphql({
						query: sharedUpdatePreferences,
						variables: {
							visualMode: visualMode,
						},
					});
				} catch (error) {
					console.log("Error updating preferences:", error);
				}
			}
			savePreferences();
		}
	}, [visualMode]);

	return [visualMode, setVisualMode as Function];
}
