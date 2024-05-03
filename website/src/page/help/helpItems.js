// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	Cards,
	Box,
	SpaceBetween,
	Link,
} from "@cloudscape-design/components";

// IMPORTS | GRAPHQL
import { helpListHelps as listHelps } from "../../graphql/queries";
// IMPORTS | FUNCTIONS
import sortDataByKey from "../../util/sortDataByKey";

export default function HistoryTable() {
	const [help, updateHelps] = useState([]);
	const { t } = useTranslation();
	
	// RUN ONCE
	// RUN ONCE | FETCH JOBS
	useEffect(() => {
		async function fetchData(query, sortA, sortB, updateFunction) {
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
						query: query,
					});

					data = response.data[query]?.items || null;
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
			} else {
				console.log("Unable to load any help data");
			}
		}
		fetchData(listHelps, "order", "title", updateHelps);
	}, []);

	return (
		<Cards
			cardDefinition={{
				header: (item) => (
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
