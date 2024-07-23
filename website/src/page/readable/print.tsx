// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import "@cloudscape-design/global-styles/index.css";

import React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from "react-to-print";

import {
	Button,
	Container,
	ContentLayout,
	Header,
	SpaceBetween,
} from "@cloudscape-design/components";

import { UseReadablePrintStyles } from "./hooks/useReadablePrintStyles";
import { UseReadableSubscription } from "./hooks/useReadableSubscription";

import { getPrintStyle } from "../../util/getPrintStyle";

import { PrintStyles } from "./enums";
import { ReadablePrintPreview as ReadablePrintPreviewTableWithImageAlternatingSide } from "./print/tableWithImageAlternatingSide";
import { ReadablePrintPreview as ReadablePrintPreviewTableWithImageLeft } from "./print/tableWithImageLeft";
import { ReadablePrintPreview as ReadablePrintPreviewTableWithImageRight } from "./print/tableWithImageRight";
import ReadableViewDetails from "./viewDetails";

export default function ReadableNew() {
	const { t } = useTranslation();
	const [metadataState, setMetadataState] = useState({});
	const [textState, setTextState] = useState([]);
	const [imageState, setImageState] = useState({});

	UseReadableSubscription(setMetadataState, setTextState, setImageState);
	const [printStyleSelected, setPrintStyleSelected] = useState();
	const { printStylesState } = UseReadablePrintStyles();
	const printStyleId = getPrintStyle();
	const [customCss, setCustomCss] = useState("");

	// DISPLAY
	// DISPLAY | HEADER
	function displayHeader() {
		return (
			<SpaceBetween size="m">
				<Header variant="h1" description={t("readable_description")}>
					{t("readable_print_title")}
				</Header>
			</SpaceBetween>
		);
	}

	// DISPLAY | HEADER
	function displayDetails() {
		return (
			<ReadableViewDetails
				metadataState={metadataState}
				setMetadataState={setMetadataState}
			/>
		);
	}

	useEffect(() => {
		const parseCss = (css) => {
			if (!printStylesState) return;
			if (!printStyleId) return;

			const printStyleDetails = printStylesState.find(
				(item) => item.id === printStyleId
			);

			if (!printStyleDetails) return;
			setPrintStyleSelected(printStyleDetails);

			const prefix = "#printPreviewWrapper";
			const prefixedCssArray = printStyleDetails.css.map(
				(item) => `${prefix} ${item}`
			);
			const prefixedCss = prefixedCssArray.join("\n");
			setCustomCss(prefixedCss);
		};
		parseCss(printStylesState, printStyleId);
	}, [printStylesState, printStyleId]);

	useEffect(() => {
		const applyCssToPreview = (css) => {
			const styleElement = document.createElement("style");
			styleElement.innerHTML = css;
			document.head.appendChild(styleElement);
		};
		applyCssToPreview(customCss);
	}, [customCss]);

	const componentRef = useRef();
	const handlePrint = useReactToPrint({
		content: () => componentRef.current,
		copyStyles: true,
		pageStyle: customCss,
	});

	return (
		<>
			<ContentLayout header={displayHeader()}>
				<SpaceBetween size="xxl">
					{displayDetails()}
					<SpaceBetween size="xl">
						<Button
							iconName="file"
							variant="primary"
							onClick={handlePrint}
							data-testid="readable-print-submit"
						>
							{t("generic_print")}
						</Button>
						<Container>
							<div ref={componentRef}>
								<div id="printPreviewWrapper">
									{printStyleSelected?.type.toLowerCase() ===
										PrintStyles.TABLEWITHIMAGELEFT.toLowerCase() && (
										<ReadablePrintPreviewTableWithImageLeft
											textState={textState}
											imageState={imageState}
										/>
									)}
									{printStyleSelected?.type.toLowerCase() ===
										PrintStyles.TABLEWITHIMAGERIGHT.toLowerCase() && (
										<ReadablePrintPreviewTableWithImageRight
											textState={textState}
											imageState={imageState}
										/>
									)}
									{printStyleSelected?.type.toLowerCase() ===
										PrintStyles.TABLEWITHIMAGEALTERNATINGSIDE.toLowerCase() && (
										<ReadablePrintPreviewTableWithImageAlternatingSide
											textState={textState}
											imageState={imageState}
										/>
									)}
								</div>
							</div>
						</Container>
					</SpaceBetween>
				</SpaceBetween>
			</ContentLayout>
		</>
	);
}
