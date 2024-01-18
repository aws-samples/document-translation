// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useEffect } from "react";
import { Auth } from 'aws-amplify';

export default function SignOut() {
	useEffect(() => {
		Auth.signOut();
	}, []);
};