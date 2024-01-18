// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css"
import {
	ContentLayout,
	SpaceBetween,
	Header,
	Button,
} from "@cloudscape-design/components";
import HistoryTable from './historyTable';

export default function Jobs() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<>
			<ContentLayout header={
				<SpaceBetween size="m">
					<Header
						variant="h1"
						// info={<Link>Info</Link>}
						description={t('translation_description')}
						actions={
							<Button
								variant="primary"
								iconName="add-plus"
								onClick={(e) => navigate("/translation/new")}
							>{t('generic_create_new')}</Button>
						}
					>
						{t('translation_title')}
					</Header>
				</SpaceBetween>}
			>
				<HistoryTable />
			</ContentLayout>
		</>
	)
};
