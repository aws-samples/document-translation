// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button, Grid, Select } from "@cloudscape-design/components";

import { UseReadablePrintStyles } from "./hooks/useReadablePrintStyles";

import { getPageJobId } from "../../util/getPageJobId";

export default function ReadableViewPrintButton() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [printStyleSelected, setPrintStyleSelected] = useState();
	const { printStyleOptions, printStyleInitial } = UseReadablePrintStyles();

	const printPreviewUrl = () => {
		const jobId = getPageJobId();
		const styleId = printStyleSelected
			? printStyleSelected.value
			: printStyleInitial.value;
		return `/readable/print/?jobId=${jobId}&printStyle=${styleId}`;
	};

	return (
		<>
			<Grid
				gridDefinition={[
					{ colspan: { default: 3, xxs: 9 } },
					{ colspan: { default: 9, xxs: 3 } },
				]}
			>
				<Select
					data-testid="readable-new-print-styles"
					selectedOption={
						printStyleSelected ? printStyleSelected : printStyleInitial
					}
					onChange={(e) => setPrintStyleSelected(e.detail.selectedOption)}
					options={printStyleOptions}
					filteringType="auto"
					statusType={printStyleOptions ? "finished" : "loading"}
				/>
				<Button
					data-testid="readable-new-print-submit"
					variant="primary"
					onClick={(event) => {
						event.preventDefault();
						navigate(printPreviewUrl());
					}}
					href="#"
				>
					{t("generic_print_preview")}
				</Button>
			</Grid>
		</>
	);
}
