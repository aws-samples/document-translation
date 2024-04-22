// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import { Select } from "@cloudscape-design/components";
import { UseReadablePrintStyles } from "./hooks/useReadablePrintStyles";

export default function ReadableViewPrintButton() {
	const { t } = useTranslation();
	const { printStyleOptions, printStyleInitial } = UseReadablePrintStyles();

	return (
		<>
			<Select
				selectedOption={printStyleInitial}
				options={printStyleOptions}
				filteringType="auto"
			/>
		</>
	);
}
