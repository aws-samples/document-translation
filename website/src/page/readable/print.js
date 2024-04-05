// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css";
import {
	ContentLayout,
	SpaceBetween,
	Header,
	Container,
	Button,
} from "@cloudscape-design/components";

import { PrintStyles } from "./enums";
import { useReactToPrint } from "react-to-print";
import { UseReadableSubscription } from "./hooks/useReadableSubscription";
import ReadableViewDetails from "./viewDetails";
import { ReadablePrintPreview as ReadablePrintPreview_EasyRead } from "./print/easyRead";
import { getPrintStyle } from "../../util/getPrintStyle";
import * as easyReadCss from "./print/easyRead.css";

export default function ReadableNew() {
	const { t } = useTranslation();
	const [metadataState, setMetadataState] = useState({});
	const [textState, setTextState] = useState([]);
	const [imageState, setImageState] = useState({});

	UseReadableSubscription(setMetadataState, setTextState, setImageState);

	const printStyle = getPrintStyle();

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

	const componentRef = useRef();
	const handlePrint = useReactToPrint({
		content: () => componentRef.current,
		copyStyles: true,
		pageStyle: easyReadCss,
	});

	return (
		<>
			<ContentLayout header={displayHeader()}>
				<SpaceBetween size="xxl">
					{displayDetails()}
					<SpaceBetween size="xl">
						<Button iconName="file" variant="primary" onClick={handlePrint}>
						{t("generic_print")}
						</Button>
						<Container>
							<div ref={componentRef}>
								<div id="print">
									{printStyle === PrintStyles.EASYREAD && (
										<ReadablePrintPreview_EasyRead
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
