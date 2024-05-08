// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useEffect, useState } from "react";

import {
	AuthSession,
	fetchAuthSession,
	getCurrentUser,
	GetCurrentUserOutput,
	signInWithRedirect,
} from "@aws-amplify/auth";

export function useFederatedSignIn() {
	// authStatus is a boolean that indicates if the user is signed in or not
	const [authStatus, setAuthStatus] = useState<boolean>(false);
	const [authSession, setAuthSession] = useState<AuthSession>();
	const [currentUser, setCurentUser] = useState<GetCurrentUserOutput>();

	useEffect(() => {
		const checkUserAuthStatus = async () => {
			try {
				const authSession = await fetchAuthSession();
				if (!authSession.credentials) {
					setAuthStatus(false);
					await signInWithRedirect();
				}
				setAuthSession(authSession);
				setAuthStatus(true);
			} catch (error) {
				console.error({ error });
			}
		};
		checkUserAuthStatus();
		// return () => Hub.remove("auth", updateUser);
	}, []);

	useEffect(() => {
		const setUserState = async (authStatus: boolean) => {
			if (authStatus) {
				try {
					setCurentUser(await getCurrentUser());
				} catch (error) {
					console.log({ error });
				}
			}
		};
		setUserState(authStatus);
	}, [authStatus]);

	return { currentUser, authSession };
}
