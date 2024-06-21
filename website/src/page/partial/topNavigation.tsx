// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";



import { IconProps, TopNavigation } from "@cloudscape-design/components";

import { useVisualMode } from "../../hooks/useVisualMode";

import { VisualModes } from "../../enums";

function getLogo() {
	const fileExtensions = ["png", "svg"];

	let logo = { src: "" };
	for (let ext of fileExtensions) {
		try {
			const logoSrc = require(`../../logo.${ext}`);
			logo = { src: logoSrc };
			break;
		} catch (e) {
			// Do nothing
		}
	}
	if (!logo.src) {
		logo.src = "";
	}
	return logo;
}
``;

export default function Header(user: {
	user: { currentUser: { username: string } };
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [visualMode, setVisualMode] = useVisualMode();

	const username = user?.user?.currentUser?.username;

	const displayVisualModeIcon = () => {
		if (visualMode === VisualModes.LIGHT) {
			return "star-filled" as IconProps.Name;
		} else if (visualMode === VisualModes.DARK) {
			return "star" as IconProps.Name;
		} else {
			return "star-half" as IconProps.Name;
		}
	};

	const toggleVisualMode = () => {
		const setMode = setVisualMode as Function;
		setMode(() => {
			if (visualMode === VisualModes.LIGHT) {
				return VisualModes.DARK;
			} else if (visualMode === VisualModes.DARK) {
				return VisualModes.AUTO;
			} else if (visualMode === VisualModes.AUTO || visualMode === undefined) {
				return VisualModes.LIGHT;
			}
		});
	};

	return (
		<TopNavigation
			identity={{
				title: "Document Transformation",
				// TODO BUSINESS NAME
				logo: getLogo(),
				href: "/",
			}}
			utilities={[
				{
					type: "button",
					iconName: displayVisualModeIcon(),
					onClick: () => toggleVisualMode(),
				},
				{
					type: "button",
					text: t("help_title"),
					onClick: () => navigate("/help"),
				},
				{
					type: "menu-dropdown",
					text: username,
					iconName: "user-profile",
					items: [
						{ id: "signout", text: t("generic_sign_out"), href: "/signout" },
					],
				},
			]}
		/>
	);
};