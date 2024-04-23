// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect } from "react";
import { API } from "aws-amplify";

const features = require("../../../features.json");
const readableListPrintStyles = features.readable
	? require("../../../graphql/queries").readableListPrintStyles
	: null;

export const UseReadablePrintStyles = () => {
	const [printStyleOptions, setPrintStyleOptions] = useState([]);
	const [printStyleInitial, setPrintStyleInitial] = useState({});
	const [printStylesState, setPrintStylesState] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchPrintStyles = async () => {
			try {
				const result = await API.graphql({
					query: readableListPrintStyles,
					authMode: "AMAZON_COGNITO_USER_POOLS",
				});

				setPrintStylesState(await result.data.readableListPrintStyles.items);

				setLoading(false);
			} catch (error) {
				console.log("Error fetching printStyles:", error);
				setError(error);
				setLoading(false);
			}
		};

		fetchPrintStyles();
	}, []);

	useEffect(() => {
		try {
			setPrintStyleOptions(
				printStylesState.map((item, index) => ({
					key: index,
					label: item.name,
					value: item.id,
					default: item.default,
					iconName: item.default ? "star" : undefined,
				}))
			);
		} catch (error) {
			console.log("Error setPrintStyleOptions:", error);
			setError(error);
			setLoading(false);
		}
	}, [printStylesState]);

	useEffect(() => {
		try {
			const defaultItem = printStylesState.find((item) => item.default);

			if (defaultItem) {
				setPrintStyleInitial({
					label: defaultItem.name,
					value: defaultItem.id,
				});
			} else {
				setPrintStyleInitial({
					label: printStylesState[0].name,
					value: printStylesState[0].id,
				});
			}
			setLoading(false);
		} catch (error) {
			console.log("Error setPrintStyleInitial:", error);
			setError(error);
			setLoading(false);
		}
	}, [printStylesState]);

	return { printStyleOptions, printStyleInitial, printStylesState };
};
