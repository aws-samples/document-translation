// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// IMPORTS
// IMPORTS | REACT
import { Suspense } from "react";
// import AppRoutes from './appRoutes';
// IMPORTS | AMPLIFY
import { Amplify } from "aws-amplify";
import { useFederatedSignIn } from "./hooks/useFederatedSignIn";
// IMPORTS | LANGUAGES
import "./util/i18n";
// IMPORTS | COMPONENTS
import TopNavigation from "./page/partial/topNavigation";
import SideNavigation from "./page/partial/sideNavigation";
import Footer from "./page/partial/footer";
// CLOUDSCAPE DESIGN
import { AppLayout } from "@cloudscape-design/components";
import AppRoutes from "./appRoutes";
// CONFIGURE
// CONFIGURE | AMPLIFY
const cfnOutputs = require("./cfnOutputs.json");

Amplify.configure({
	Auth: {
		Cognito: {
			userPoolId: cfnOutputs.awsUserPoolsId,
			userPoolClientId: cfnOutputs.awsUserPoolsWebClientId,
			identityPoolId: cfnOutputs.awsCognitoIdentityPoolId,
			allowGuestAccess: false,
			loginWith: {
				oauth: {
					domain:
						cfnOutputs.awsCognitoOauthDomain +
						".auth." +
						cfnOutputs.awsRegion +
						".amazoncognito.com",
					scopes: ["openid"],
					redirectSignIn: [cfnOutputs.awsCognitoOauthRedirectSignIn],
					redirectSignOut: [cfnOutputs.awsCognitoOauthRedirectSignOut],
					responseType: "code",
				},
			},
		},
	},
	API: {
		GraphQL: {
			endpoint: cfnOutputs.awsAppsyncGraphqlEndpoint,
		}
	}
});

// FUNCTIONS
export default function App() {
	const currentUser = useFederatedSignIn();

	return (
		<>
			<Suspense fallback={null}>
				<TopNavigation user={currentUser} />
				<AppLayout
					navigation={<SideNavigation />}
					toolsHide
					content={<AppRoutes />}
				></AppLayout>
				<Footer />
			</Suspense>
		</>
	);
}
