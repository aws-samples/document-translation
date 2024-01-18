// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from 'react';
import { useTranslation } from 'react-i18next';

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css"
import {
	ContentLayout,
	SpaceBetween,
	Header,
} from "@cloudscape-design/components";

import NewForm from './newForm';

export default function TranslationNew() {

	const { t } = useTranslation();

	return (
		<>
			<ContentLayout header={
				<SpaceBetween size="m">
					<Header
						variant="h1"
						description={t('translation_description')}
					>
						{t('translation_new_title')}
					</Header>
				</SpaceBetween>}
			>
				<NewForm 
					updateJobs
					jobs
				/>
			</ContentLayout>
		</>
	)
}