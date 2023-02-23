// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React 			from 'react';
import { FcDocument }	from 'react-icons/fc';
import { useTranslation } from 'react-i18next';
// AMPLIFY
import {
	View,
	Heading,
	useTheme,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

let logo
try {
	logo = require('./logo.png');
} catch {
	logo = false;
}

export default function Header() {
	const { tokens } = useTheme();
	const { t } = useTranslation();
	return (
		<View
			backgroundColor={tokens.colors.background.secondary}
			padding={tokens.space.medium}
		>
			<div>
				<Heading level={1}>
					{logo && <span className="align-with-text"><img src={logo} alt="logo" /></span>}
					{!logo && <FcDocument className="align-with-text" />}
					<span className="align-with-text">&nbsp;{ t('document_translation') }</span>
				</Heading>
			</div>
		</View>
	)
}