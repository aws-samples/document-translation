// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
// import React from "react";
import React, { FC,Suspense } from 'react';
import { useTranslation } from 'react-i18next';
// AMPLIFY
import config  from './aws-exports'
import { Amplify, API, Storage, Auth, Hub } from 'aws-amplify';
import { listJobs }				 from './graphql/queries';
import {
	useTheme,
	View,
	Tabs, 
	TabItem,
} from '@aws-amplify/ui-react';
// LANG
import './i18n';
// APP
import Header		from './Header';
import Footer		from './Footer';
import Help			from './Help';
import MyJobs		from './MyJobs';
import CreateJob	from './CreateJob';

Amplify.configure(config)
const federatedIdName = "Single-Sign-On";
Storage.configure({ level: 'private' });

function forceSampleValues(data) {
	data.forEach(function(job, i) { 
		data[i].id = "sample";
		data[i].jobOwner = "sample";
		data[i].translateKey = "{\"sample\":\"sample\"}";
	})
	return data;
}

function sortDataByCreatedAt(data) {
	data.sort((a,b) => (a.createdAt < b.createdAt) ? 1 : ((b.createdAt < a.createdAt) ? -1 : 0))
	return data;
}

export default function App(props) {
	const [token, setToken] = React.useState(null);

	/* Initial state: jobs */
	const [jobs, updateJobs] = React.useState([]);

	let [user, setUser] = React.useState(null)
	React.useEffect(() => {
		/* Fetch jobs on load */
		let data;
		async function fetchJobs() {
			console.log("Loading job data");
			await API.graphql({ query: listJobs, authMode: 'AMAZON_COGNITO_USER_POOLS' }).then(response => {
				console.log("Loading job data: Checking for Cloud jobs");
				console.log(response);
				data = response.data.listJobs.items;
				// If no data, use sampleData
				if ( data === undefined || data.length === 0 ){
					console.log("Loading job data: No cloud jobs");
					try {
						data = require("./jobData.json");
						console.log("Loading job data: Using user sample jobs");
					} catch {
						data = require("./sampleJobData.json");
						console.log("Loading job data: Using project sample jobs");
					}
					data = forceSampleValues(data);
				}
				data = sortDataByCreatedAt(data);
				console.log("Loading job data: Using jobs");
				console.log(data);
				updateJobs(data);
			}).catch(e => {
				console.log(e);
				console.log("ERROR: " + e.errors[0].message);
			});
		}

		/* Check user is logged in, redirect if not */
		let updateUser = async authState => {
			console.log("Auth State: Check auth state");
			let user = await Auth.currentAuthenticatedUser().then(user => {
				console.log(user);
				console.log("Auth State: Set user");
				setUser(user);
				console.log("Auth State: Fetch user jobs");
				fetchJobs();
			}).catch(e => {
				console.log("Auth State: " + e);
				console.log("Auth State: Set user to null");
				setUser(null);
				console.log("Auth State: Redirect to login");
				Auth.federatedSignIn();
			});
		}
		Hub.listen('auth', updateUser)
		updateUser()
		return () => Hub.remove('auth', updateUser)
	}, []);

	const [tabIndex, setTabIndex] = React.useState(0);
	const { tokens } = useTheme();

	const { t } = useTranslation();
	return (

        <Suspense fallback={null}>


		<View
			backgroundColor={tokens.colors.background.secondary}
			padding={tokens.space.large}
		>
			<View
				maxWidth="1000px"
				margin="0 auto"
			>
				<Header />
				<Tabs
					justifyContent="flex-start"
					currentIndex={tabIndex}
					onChange={(i) => setTabIndex(i)}
				>
					<TabItem title={ t('my_translations') }>
						<MyJobs jobs={jobs} />
					</TabItem>
					<TabItem title={ t('new_translation') }>
						<CreateJob
							updateJobs={updateJobs}
							jobs={jobs}
						/>
					</TabItem>
					<TabItem className="helpTab" title={ t('help') }>
						<Help />
					</TabItem>
					<TabItem title={ t('sign_out') } 
					onClick={() => Auth.signOut()}
					>
						<View
							backgroundColor={tokens.colors.background.secondary}
							padding={tokens.space.medium}
						>
							<p>Signing out...</p>
						</View>
					</TabItem>
				</Tabs>
				<Footer />
			</View>
		</View>

        </Suspense>

	);
}