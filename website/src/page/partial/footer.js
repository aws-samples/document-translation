// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from 'react';
import { useTranslation } from 'react-i18next';
// CLOUDSCAPE DESIGN
import {
	Link,
	Box,
} from "@cloudscape-design/components";

let footerLinks;
try { footerLinks = require("../../footerLinks.json"); }
catch { footerLinks = require("../../sampleData/sampleFooterLinks.json"); }

export default function Footer() {
	return (
		<footer className="pagefooter" role="navigation" aria-label="footer">
			<Box
				margin={{ left: "xxl" }}
				padding={{ left: "xxl" }}
			>
				<ul className="list-no-bullet list-can-collapse">
					{footerLinks.map((link, i) => {
						return (
							// Allow any combination of prefix, suffix, link text, and link url
							// Only show links is link url exists
							<div
								key={i}
								as="span"
							>
								<li>
									{/* PREFIX */}
									{/* Show prefix text if 'prefix' exists */}
									{link.prefix && <>
										{link.prefix}
										{/* Add space if 'url' or 'suffix' exists in addition to 'prefix' */}
										{(link.url || link.suffix) && <>&nbsp;</>}
									</>}

									{/* LINK */}
									{/* Show hyperlink if 'url' exists */}
									{link.url && <>
										<Link href={link.url}>
											{/* Show link text if 'link' exists */}
											{link.text && link.text}
											{/* Show url text if 'link' does not exists */}
											{!link.text && link.url}
										</Link>

										{/* Add space if 'suffix' exists in addition to 'url' */}
										{(link.suffix) && <>&nbsp;</>}
									</>}

									{/* SUFFIX */}
									{/* Show suffix if it exists */}
									{link.suffix && link.suffix}
								</li>
							</div>
						)
					})}
				</ul>
			</Box>
		</footer>
	)
}