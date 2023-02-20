// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React from 'react';
import { useTranslation } from 'react-i18next';
// AMPLIFY
import {
	View,
	useTheme,
	Divider,
	Link,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

let footerLinks;
try       { footerLinks = require("./footerLinks.json");       }
	catch { footerLinks = require("./sampleFooterLinks.json"); }

export default function Footer() {
	const { tokens } = useTheme();
	const { t } = useTranslation();

	return (
		<View
			backgroundColor={tokens.colors.background.secondary}
			padding={tokens.space.medium}
			paddingLeft="0"
			paddingRight="0"
		>
			<Divider
				orientation="horizontal"
				size="small"
				label={ t('links') }
			/>
			<ul className="list-no-bullet list-can-collapse">
				{footerLinks.map((link, i) => {     
					return (
						// Allow any combination of prefix, suffix, link text, and link url
						// Only show links is link url exists
						<View
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
									<Link  href={link.url}>
										{/* Show link text if 'link' exists */}
										{link.text && link.text}
										{/* Show url text if 'link' does not exists */}
										{!link.text && link.url}
									</Link>
									
									{/* Add space if 'suffix' exists in addition to 'url' */}
									{ (link.suffix) && <>&nbsp;</>} 
								</>}

								{/* SUFFIX */}
								{/* Show suffix if it exists */}
								{link.suffix && link.suffix} 
							</li>
						</View>
					) 
				})}
			</ul>
		</View>
	)
}