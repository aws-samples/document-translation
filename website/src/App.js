// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// IMPORTS
// IMPORTS | REACT
import { Suspense, useEffect, useState } from 'react';
import AppRoutes from './appRoutes';
// IMPORTS | AMPLIFY
import { Amplify, Auth, Hub } from "aws-amplify";
// import amplifyConfig from "./util/aws-exports";
// IMPORTS | LANGUAGES
import "./util/i18n";
// IMPORTS | COMPONENTS
import TopNavigation from "./page/partial/topNavigation";
import SideNavigation from "./page/partial/sideNavigation";
// import Header from './page/partial/header';
import Footer from "./page/partial/footer";
// CLOUDSCAPE DESIGN
import { AppLayout } from "@cloudscape-design/components";
// CONFIGURE
// CONFIGURE | AMPLIFY
const cfnOutputs = require("./cfnOutputs.json");

Amplify.configure({
	// Cognito
	aws_cognito_region: cfnOutputs.awsRegion,
	aws_user_pools_id: cfnOutputs.awsUserPoolsId,
	aws_user_pools_web_client_id: cfnOutputs.awsUserPoolsWebClientId,
	aws_cognito_identity_pool_id: cfnOutputs.awsCognitoIdentityPoolId,
	oauth: {
		domain: cfnOutputs.awsCognitoOauthDomain + '.auth.' + cfnOutputs.awsRegion + '.amazoncognito.com',
		redirectSignIn: cfnOutputs.awsCognitoOauthRedirectSignIn,
		redirectSignOut: cfnOutputs.awsCognitoOauthRedirectSignOut,
		scope: ['openid'],
		responseType: 'code'
	},
	// AppSync
	aws_appsync_graphqlEndpoint: cfnOutputs.awsAppsyncGraphqlEndpoint
});

// FUNCTIONS
export default function App() {
	const [user, setUser] = useState(null);

	useEffect(() => {
		// Checks if user is logged in, redirecting if not
		async function updateUser() {
			try {
				// Check the authentication state
				// console.log("Checking authentication state...");
				const user = await Auth.currentAuthenticatedUser();

				// Set the user
				// console.log("Setting user...");
				setUser(user);
			} catch (error) {
				if (error === "The user is not authenticated") {
					// If the user is not authenticated, set the user to null and redirect to the login page
					// console.log("User not authenticated");
					setUser(null);
					// console.log("Redirecting to login page...");
					await Auth.federatedSignIn();
				} else {
					console.error("ERROR:", error);
				}
			}
		}
		updateUser();
		return () => Hub.remove("auth", updateUser);
	}, []);

	return (
		<>
			<Suspense fallback={null}>
				<TopNavigation user={user} />
				<AppLayout
					navigation={<SideNavigation />}
					toolsHide
					content={<AppRoutes />}
				></AppLayout>
				<Footer />
			</Suspense>
		</>
	);
};
