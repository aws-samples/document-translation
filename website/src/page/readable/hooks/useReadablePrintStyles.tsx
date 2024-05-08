// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useEffect, useState } from "react";

import { generateClient } from "@aws-amplify/api";

const client = generateClient({ authMode: "userPool" });

const features = require("../../../features.json");
const readableListPrintStyles = features.readable
	? require("../../../graphql/queries").readableListPrintStyles
	: null;

interface ItemType {
	key: number;
	label: any;
	value: any;
	default: any;
	iconName: string | undefined;
}

interface Item {
	id: string;
	name: string;
	default: boolean;
}

export const UseReadablePrintStyles = () => {
	const [printStyleOptions, setPrintStyleOptions] = useState<ItemType[]>([]);
	const [printStyleInitial, setPrintStyleInitial] = useState({});
	const [printStylesState, setPrintStylesState] = useState([]);

	// const [loading, setLoading] = useState(true);
	// const [error, setError] = useState(null);

	useEffect(() => {
		const fetchPrintStyles = async () => {
			try {
				const result = await client.graphql({
					query: readableListPrintStyles,
				});

				if ("data" in result) {
					setPrintStylesState(await result.data.readableListPrintStyles.items);
				}
				// setLoading(false);
			} catch (error) {
				console.log("Error fetching printStyles:", error);
				// setError(error);
				// setLoading(false);
			}
		};

		fetchPrintStyles();
	}, []);

	useEffect(() => {
		try {
			if (printStylesState) {
				setPrintStyleOptions(
					printStylesState.map((item: Item, index: number) => ({
						key: index,
						label: item.name,
						value: item.id,
						default: item.default,
						iconName: item.default ? "star" : undefined,
					}))
				);
			}
		} catch (error) {
			console.log("Error setPrintStyleOptions:", error);
			// setError(error);
			// setLoading(false);
		}
	}, [printStylesState]);

	useEffect(() => {
		try {
			if (printStylesState.length === 0) return;

			const defaultItem = findDefaultItem(printStylesState);

			if (defaultItem) {
				setPrintStyleInitial({
					label: defaultItem.name,
					value: defaultItem.id,
				});
			} else {
				const firstItem = getFirstItem(printStylesState);
				if (firstItem) {
					setPrintStyleInitial({
						label: firstItem.name,
						value: firstItem.id,
					});
				} else {
					setPrintStyleInitial({
						label: "",
						value: "",
					});
				}
			}
		} catch (error) {
			console.log("Error setPrintStyleInitial:", error);
		}
	}, [printStylesState]);

	function findDefaultItem(items: Item[]): Item | null {
		const defaultItem = items.find((item) => item.default);
		return defaultItem || null;
	}

	function getFirstItem(items: Item[]): Item | null {
		return items.length > 0 ? items[0] : null;
	}

	return { printStyleOptions, printStyleInitial, printStylesState };
};
