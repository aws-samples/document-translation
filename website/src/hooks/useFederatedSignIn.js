// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {
	fetchAuthSession,
	signInWithRedirect,
	getCurrentUser,
} from "aws-amplify/auth";
import { useState, useEffect } from "react";

export function useFederatedSignIn() {
	const [authStatus, setAuthStatus] = useState(false);
    const [authSession, setAuthSession ] = useState(null);
	const [currentUser, setCurentUser] = useState(null);

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
		const setUserState = async (authStatus) => {
			if (authStatus) {
				try {
					setCurentUser(await getCurrentUser());
				} catch (error) {
					console.log({ error });
				}
			} else {
				setCurentUser(null);
			}
		};
		setUserState(authStatus);
	}, [authStatus]);

	return { currentUser, authSession };
}
