// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// IMPORTS
// IMPORTS | REACT
import { Suspense, useEffect, useState } from 'react';
// IMPORTS | AMPLIFY
import { Amplify, API, Storage, Auth, Hub } from 'aws-amplify';
import { useTheme, View, Tabs, TabItem } from '@aws-amplify/ui-react';
import config from './aws-exports'
// IMPORTS | GRAPHQL
import { listJobs } from './graphql/queries';
// IMPORTS | LANG
import { useTranslation } from 'react-i18next';
import './i18n';
// IMPORTS | APP
import Header    from './Header';
import Footer    from './Footer';
import Help      from './Help';
import MyJobs    from './MyJobs';
import CreateJob from './CreateJob';
// IMPORTS | FUNCTIONS
import sortDataByKey from './sortDataByKey';
import loadSampleData      from './loadSampleData';
import forceSampleValues   from './forceSampleValues';

// CONFIGURE
// CONFIGURE | AMPLIFY
Amplify.configure(config)
Storage.configure({ level: 'private' });

// FUNCTIONS
// Initiates federated sign-in process
async function signIn() {
	console.log("Starting federated sign-in...");
	try {
		await Auth.federatedSignIn();
		console.log("Federated sign-in successful.");
	} catch (error) {
		console.error("ERROR:", error);
	}
}

export default function App(props) {
	const [jobs, updateJobs]             = useState([]);
	const [user, setUser]                = useState(null)
	const [signingOut, updateSigningOut] = useState(false);
	const [signedOut, updateSignedOut]   = useState(false);

	useEffect(() => {		
		// Fetches users job history
		async function fetchJobs() {
			let data;
			try {
				// Fetch jobs
				const response = await API.graphql({ query: listJobs, authMode: 'AMAZON_COGNITO_USER_POOLS' });
				data = response.data.listJobs.items;
				// If no data is returned, load sample data instead
				if (data === undefined || data.length === 0) {
					data = await loadSampleData()
				}
				
				// Sort the job data by creation date
				data = sortDataByKey("createdAt", "id", data);
				
				// Update the job data state with the fetched data
				updateJobs(data);
			} catch (error) {
				console.error(error);
				console.error("ERROR: " + error.errors[0].message);
			}
		}

		// Checks if user is logged in, redirecting if not
		async function updateUser() {
			try {
				// Check the authentication state
				console.log("Checking authentication state...");
				const user = await Auth.currentAuthenticatedUser();

				// Set the user
				console.log("Setting user...");
				setUser(user);

				// Fetch user jobs
				console.log("Fetching user jobs...");
				await fetchJobs();
			} catch (error) {
				if (error === 'The user is not authenticated') {
					// If the user is not authenticated, set the user to null and redirect to the login page
					console.log("User not authenticated");
					setUser(null);
					console.log("Redirecting to login page...");
					await Auth.federatedSignIn();
				} else {
					console.error("ERROR:", error);
				}
			}
		}

		// Handles path names for user states
		async function handlePathname() {
			try {
				const pathname = window.location.pathname.toLowerCase();
				switch (pathname) {
					// If the pathname is '/signout/' or '/signout', sign out the user
					case '/signout/':
					case '/signout':
						updateSigningOut(true)
						console.log('Signing out the user...');
						await Auth.signOut();
						break;

					// If the pathname is '/signedout/' or '/signedout', wait, then redirect to the homepage
					case '/signedout/':
					case '/signedout':
						updateSignedOut(true)
						console.log('Redirecting the user...');
						setTimeout(() => {
							window.location.assign('/');
						}, 5000);
						break;

					// For all other pathnames, listen for authentication events and fetch user data
					default:
						Hub.listen('auth', updateUser);
						updateUser();
				}
			} catch (error) {
				console.error("ERROR:", error);
			}
		};
		handlePathname();

		return () => Hub.remove('auth', updateUser)
	}, []);

	const [tabIndex, setTabIndex] = useState(0);
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
					{!signingOut &&
						<Tabs
							justifyContent="flex-start"
							currentIndex={tabIndex}
							onChange={(i) => setTabIndex(i)}
						>
							<TabItem title={t('my_translations')}>
								<MyJobs jobs={jobs} />
							</TabItem>
							<TabItem title={t('new_translation')}>
								<CreateJob
									updateJobs={updateJobs}
									jobs={jobs}
								/>
							</TabItem>
							<TabItem className="helpTab" title={t('help')}>
								<Help />
							</TabItem>
							<TabItem title={t('sign_out')}
								onClick={() => window.location.assign("/signout")}
							>
								<View
									backgroundColor={tokens.colors.background.secondary}
									padding={tokens.space.medium}
								>
								</View>
							</TabItem>
						</Tabs>
					}
					{signingOut && <p>{t('signing_out')}...&#128075;</p>}
					{signedOut && <p>{t('signed_out')}...&#128075;</p>}
					<Footer />
				</View>
			</View>
		</Suspense>
	);
}