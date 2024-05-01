// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// IMPORTS
// IMPORTS | REACT
import { Suspense } from "react";
// import AppRoutes from './appRoutes';
// IMPORTS | AMPLIFY
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
import { amplifyConfigure } from "./util/amplifyConfigure";


// FUNCTIONS
export default function App() {
	amplifyConfigure();
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
