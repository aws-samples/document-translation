// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// CLOUDSCAPE DESIGN
import {
	SideNavigation
} from "@cloudscape-design/components";

import {
	CreateJob as ReadableCreateJob,
} from '../../util/readableCreateJob';

const features = require("../../features.json");

export default function Navigation() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const navigationItems = []
	if (features.translation) {
		navigationItems.push({
			type: "section-group",
			title: t("translation_title"),
			items: [
				{
					type: "link",
					text: t("generic_history"),
					href: "/translation/history",
				},
				{
					type: "link",
					text: t("generic_create_new"),
					href: "/translation/new",
				},
			],
		});
	}
	if (features.translation && features.readable) {
		navigationItems.push({ type: "divider" });
	};
	if (features.readable) {
		navigationItems.push({
			type: "section-group",
			title: t("readable_title"),
			items: [
				{
					type: "link",
					text: t("generic_history"),
					href: "/readable/history",
				},
				{
					type: "link",
					text: t("generic_create_new"),
					href: "/readable/view",
				},
			],
		})
	};

	return (
		<SideNavigation
			activeHref={window.location.pathname}
			onFollow={async (event) => {
				if (!event.detail.external) {
					event.preventDefault();

					const readableViewHref = "/readable/view";
					const href = event.detail.href;
					if (href.startsWith(readableViewHref)) {
						const jobId = await ReadableCreateJob();
						const jobHref = `${readableViewHref}?jobId=${jobId}`;

						if (window.location.pathname.startsWith(readableViewHref)) {
							window.location.href = jobHref;
							return;
						} else {
							navigate(jobHref);
							return;
						}
					}
					navigate(href);
				}
			}}
			items={navigationItems}
		/>
	);
}