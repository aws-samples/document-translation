// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";
import { Route, Routes } from "react-router-dom";

import SignOut from "./util/signOut";

import Help from "./page/help/help";
import ReadableHistory from "./page/readable/history";
import ReadablePrint from "./page/readable/print";
import ReadableView from "./page/readable/view";
import TranslationHistory from "./page/translation/history";
import TranslationNew from "./page/translation/new";

const features = require("./features.json");

export default function AppRoutes() {
	return (
		<Routes>
			{features.translation && (
				<>
					<Route path="/" element={<TranslationHistory />} />
					<Route path="/translation/" element={<TranslationHistory />} />
					<Route
						path="/translation/history/"
						element={<TranslationHistory />}
					/>
					<Route path="/translation/new/" element={<TranslationNew />} />
				</>
			)}
			{!features.translation && features.readable && (
				<Route path="/" element={<ReadableHistory />} />
			)}
			{features.readable && (
				<>
					<Route path="/readable/" element={<ReadableHistory />} />
					<Route path="/readable/history/" element={<ReadableHistory />} />
					<Route path="/readable/view/*" element={<ReadableView />} />
					<Route path="/readable/print/*" element={<ReadablePrint />} />
				</>
			)}
			<Route path="/help/" element={<Help />} />
			<Route path="/signout/" element={<SignOut />} />
		</Routes>
	);
}
