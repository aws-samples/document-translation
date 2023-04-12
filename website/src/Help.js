// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from 'react';
// AMPLIFY
import { API } from 'aws-amplify';
import { listHelps } from './graphql/queries';
import {
	View,
	useTheme,
	Collection,
	Card,
	Heading,
	Text,
	Link,
	Flex,
	Button,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import sortDataByKey from './sortDataByKey';

export default function Help() {
	/* Initial state */
	const [help, updateHelps] = React.useState([]);

	/* Fetch help on load */
	React.useEffect(() => {
		let data;
		try {
			data = require("./helpData.json");
			// Sort array by order
			data = sortDataByKey("order", "title", data);
			updateHelps(data);
		} catch {
			async function fetchHelps() {
				await API.graphql({ query: listHelps, authMode: 'AMAZON_COGNITO_USER_POOLS' }).then(response => {
					console.log(response);
					data = response.data.listHelps.items
					// If no data, use sampleData
					data = ( data === undefined || data.length === 0 ) ? require("./sampleHelpData.json") : data;
					// Sort array by order
					data = sortDataByKey("order", "title", data);
					updateHelps(data);
				}).catch(e => {
					console.log(e);
					console.log("ERROR: " + e.errors[0].message);
				});
			}
			fetchHelps();
		};
	}, []);
	
	const { tokens } = useTheme();
	return (
		<View
			backgroundColor={tokens.colors.background.secondary}
			padding={tokens.space.medium}
		>
			<Collection
				type="list"
				items={help}
				isPaginated
				itemsPerPage='10'
				gap="1.5rem"
			>
				{(item, index) => (
					<Card key={index} variation="outlined">
						<Flex
							direction="column"
							gap={tokens.space.large}
						>
							{item.title && <Heading level={4}>{item.title}</Heading>}
							{item.description && <Text>{item.description}</Text>}
							{item.link && <Link href={item.link} isExternal={true}>
								<Button 
									size="small"
									variation="primary"
									title="More info"
								>More info</Button>
							</Link>}
						</Flex>
					</Card>
				)}
			</Collection>
		</View>
	)
}