// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from "react";

import { Box, Link } from "@cloudscape-design/components";

interface footerItem {
	prefix?: string;
	url?: string;
	text?: string;
	suffix?: string;
}
interface footerLinks extends Array<footerItem> {}

let footerData: footerLinks;
try {
	footerData = require("../../footerLinks.json");
} catch {
	footerData = require("../../sampleData/sampleFooterLinks.json");
}

export default function Footer() {
	return (
		<footer className="pagefooter" role="navigation" aria-label="footer">
			<Box margin={{ left: "xxl" }} padding={{ left: "xxl" }}>
				<ul className="list-no-bullet list-can-collapse">
					{footerData.map((link, i) => {
						return (
							// Allow any combination of prefix, suffix, link text, and link url
							// Only show links is link url exists
							<div key={i}>
								<li>
									{/* PREFIX */}
									{/* Show prefix text if 'prefix' exists */}
									{link.prefix && (
										<>
											{link.prefix}
											{/* Add space if 'url' or 'suffix' exists in addition to 'prefix' */}
											{(link.url || link.suffix) && <>&nbsp;</>}
										</>
									)}

									{/* LINK */}
									{/* Show hyperlink if 'url' exists */}
									{link.url && (
										<>
											<Link href={link.url}>
												{/* Show link text if 'link' exists */}
												{link.text && link.text}
												{/* Show url text if 'link' does not exists */}
												{!link.text && link.url}
											</Link>

											{/* Add space if 'suffix' exists in addition to 'url' */}
											{link.suffix && <>&nbsp;</>}
										</>
									)}

									{/* SUFFIX */}
									{/* Show suffix if it exists */}
									{link.suffix && link.suffix}
								</li>
							</div>
						);
					})}
				</ul>
			</Box>
		</footer>
	);
}
