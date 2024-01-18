// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// IMPORTS
// IMPORTS | ROUTING
import { Routes, Route } from 'react-router-dom';
// IMPORTS | ROUTING | PAGES
import SignOut from './util/signOut';
import Help from "./page/help/help";
import TranslationHistory from './page/translation/history';
import TranslationNew from './page/translation/new';
import ReadableHistory from './page/readable/history';
import ReadableView from './page/readable/view';
import { useNavigate } from "react-router-dom";

const features = require("./features.json");

export default function AppRoutes() {
	return (
		<Routes>
			{features.translation && 
				<>
					<Route path="/" element={<TranslationHistory />} />
					<Route path="/translation/" element={<TranslationHistory />} />
					<Route path="/translation/history/" element={<TranslationHistory />} />
					<Route path="/translation/new/" element={<TranslationNew />} />
				</>
			}
			{!features.translation && features.readable && 
					<Route path="/" element={<ReadableHistory />} />
			}
			{features.readable && 
				<>
					<Route path="/readable/" element={<ReadableHistory />} />
					<Route path="/readable/history/" element={<ReadableHistory />} />
					<Route path="/readable/view/*" element={<ReadableView />} />
				</>
			}
			<Route path="/help/" element={<Help />} />
			<Route path="/signout/" element={<SignOut />} />
		</Routes>
	);
};