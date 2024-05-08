// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";

import { signOut } from "@aws-amplify/auth";

export default function SignOut() {
	const handleSignOut = async () => {
		await signOut();
	};
	handleSignOut();

	return <></>;
}