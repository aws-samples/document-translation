// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// CLOUDSCAPE DESIGN
import {
	TopNavigation
} from "@cloudscape-design/components";

function getLogo(){
	const fileExtensions = ['png', 'svg'];
	
	let logo = {};
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
		logo = false;
	}
	return logo;
}

export default function Header(user) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	let username = "";
	if (user && user.user && user.user.username) {
		username = user.user.username;
	}

	return (
		<TopNavigation
			identity={{
				title: "Document Transformation",
				// TODO BUSINESS NAME
				logo: getLogo()
			}}
			utilities={[
				{
					type: "button",
					text: t('help_title'),
					onClick: () => navigate("/help"),
				},
				{
					type: "menu-dropdown",
					text: username,
					iconName: "user-profile",
					items: [
						{ id: "signout", text: t('generic_sign_out'), href: "/signout" },
					]
				}
			]} />
	)
}