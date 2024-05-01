// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Amplify } from "aws-amplify";
const cfnOutputs = require("../cfnOutputs.json");

export function amplifyConfigure() {
    const authConfig = {
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
        }
    }
    const apiConfig = {
        API: {
            GraphQL: {
                endpoint: cfnOutputs.awsAppsyncGraphqlEndpoint,
            }
        }
    }
	Amplify.configure({...authConfig, ...apiConfig});
}

export function amplifyConfigureAppend(additionalConfig) {
    const currentConfig = Amplify.getConfig();
	Amplify.configure({ ...currentConfig, ...additionalConfig });
}
