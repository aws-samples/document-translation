// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Box, Cards, Link, SpaceBetween } from "@cloudscape-design/components";

import { generateClient } from "@aws-amplify/api";

import { helpListHelps as listHelps } from "../../graphql/queries";

import sortDataByKey from "../../util/sortDataByKey";

interface Item {
	title: string;
	description: string;
	link: string;
	order: number;
}

export default function HistoryTable() {
	const [help, updateHelps] = useState([]);
	const { t } = useTranslation();
	const [loading, setLoading] = useState<boolean>(true);

	// RUN ONCE
	// RUN ONCE | FETCH JOBS
	useEffect(() => {
		async function fetchData(
			sortA: string,
			sortB: string,
			updateFunction: Function
		) {
			const client = generateClient({ authMode: "userPool" });
			let data;

			try {
				// Attempt to load user provided local data
				data = require("../../helpData.json");
				console.log("Loaded local data:", data);
			} catch (error) {
				console.log("No local data found.");
			}

			if (!data) {
				// Attempt to load user provided cloud data
				try {
					const response = await client.graphql({
						query: listHelps,
					});

					if ("data" in response) {
						data = response.data.listHelps?.items || null;
					}

					console.log("Loaded cloud data:", data);
				} catch (error) {
					console.log("No cloud data found.");
				}
			}

			if (!data) {
				// Attempt to load project sample data
				try {
					data = require("../../sampleData/sampleHelpData.json");
					console.log("Loaded project sample data:", data);
				} catch (error) {
					console.log("No project sample data found.");
				}
			}

			if (data) {
				// Local or cloud data found
				const dataSorted = sortDataByKey(sortA, sortB, data);
				updateFunction(dataSorted);
				setLoading(false);
			} else {
				console.log("Unable to load any help data");
			}
		}
		fetchData("order", "title", updateHelps);
	}, []);

	return (
		<Cards
			cardDefinition={{
				header: (item: Item) => (
					<Link href={item.link} fontSize="heading-m">
						{item.title}
					</Link>
				),
				sections: [
					{
						id: "description",
						content: (item) => item.description,
					},
				],
			}}
			items={help}
			loadingText={t("generic_loading")}
			loading={loading}
			empty={
				<Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
					<SpaceBetween size="m">
						<b>{t("generic_none")}</b>
					</SpaceBetween>
				</Box>
			}
			// filter={
			// 	<TextFilter filteringPlaceholder={t("generic_filter_placeholder")} />
			// }
			// header={
			// 	<Header
			// 		counter={"(" + help.length + ")"}
			// 	>
			// 		{t("generic_filter_title")}
			// 	</Header>
			// }
			// pagination={<Pagination currentPageIndex={1} pagesCount={2} />}
		/>
	);
}
