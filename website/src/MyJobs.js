// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { useTranslation } from 'react-i18next';

// AMPLIFY
import { Auth, Storage } from 'aws-amplify';
import {
	useTheme,
	View,
	Table,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	Button,
	Text,
	Badge,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export default function Jobs({
	jobs = []
}) {
	const { tokens } = useTheme();
	const { t } = useTranslation();

	/* download hanlder	*/
	async function download(e) {
		try {
			console.log(e);
			console.log(e.target);
			console.log(e.target.value);
			const stringKeys = e.target.value;
			console.log(stringKeys);
			const keys = JSON.parse(stringKeys)
			const credentials = await Auth.currentUserCredentials();
			
			for(var i in keys) {
				console.log("Downloading key:", keys[i]);
				if (keys[i] === "sample") {
					console.log("Skipping sample download");
					return;
				}

				const userPrefix = "private/" + credentials.identityId + "/";
				const downloadKey = keys[i].replace(userPrefix, "");
			
				const signedURL = await Storage.get(downloadKey, {
					level: 'private',
					expires: 60,
				});
				console.log(signedURL);
				console.log("Downloading signedURL:", signedURL);
				window.open(signedURL, '_blank', 'noopener,noreferrer');
			};
		} catch (err) {
			console.log('error: ', err);
		}
	};

	/* formatTargets */
    const formatTargets = (stringTargets) => {
		const targets = JSON.parse(stringTargets)
		const showSummary = ( targets.length > 6 ) ? true : false;

		return (
			<>
			{showSummary && <span>{targets.length} { t('jobs_table_status_languages') }</span>}
			{!showSummary && JSON.stringify(targets)
					.replaceAll(',', ', ')
					.replaceAll('[','')
					.replaceAll(']','')
					.replaceAll('"','')
			}
			</>
		);
	}

	/* formatTimestamp */
    const formatTimestamp = (unixSeconds) => {
		const unixMilliseconds = unixSeconds * 1000;
		const timestamp = new Date(unixMilliseconds);
		return (
			<>
			<ul className="list-no-bullet">
				<li>{timestamp.toLocaleDateString()}</li>
				<li>{timestamp.toLocaleTimeString()}</li>
			</ul>
			</>
		);
	}

	return (
		<View
			backgroundColor={tokens.colors.background.secondary}
			padding={tokens.space.medium}
		>
		{jobs[0] && jobs[0].id === "sample" && 
			<>
			<View
				padding="1rem 0"
			>
				<Text variation="info"><Badge variation="info">{ t('notice_tag_note') }</Badge>&nbsp;{ t('notice_sample') }</Text>
			</View>
			</>
		}
		{jobs[0] &&
			<Table
				size={'small'}
				className="job-info"
				variation={'striped'}
			>
				<TableHead>
					<TableRow>
						<TableCell as="th">{ t('jobs_table_header_name') }</TableCell>
						<TableCell as="th">{ t('jobs_table_header_created') }</TableCell>
						<TableCell as="th" className="can-collapse">{ t('jobs_table_header_source') }</TableCell>
						<TableCell as="th">{ t('jobs_table_header_targets') }</TableCell>
						<TableCell as="th">{ t('jobs_table_header_status') }</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{jobs.map(( item, index ) => {
					return (
						<TableRow key={index}>
							<TableCell>
								{item.jobName}
								<br/>
								<span className="jobId">{item.id}</span>
							</TableCell>
							<TableCell>
								{item.createdAt && formatTimestamp(item.createdAt) }
							</TableCell>
							<TableCell className="can-collapse">
								{item.languageSource}
							</TableCell>
							<TableCell>
								{formatTargets(item.languageTargets)}
							</TableCell>
							<TableCell>
								{item.jobStatus.toUpperCase() === "UPLOADED"   && <Text variation="info">{ t('jobs_table_status_uploaded') }</Text>}
								{item.jobStatus.toUpperCase() === "PROCESSING" && <Text variation="info">{ t('jobs_table_status_processing') }</Text>}
								{item.jobStatus.toUpperCase() === "EXPIRED"    && <Text variation="warning">{ t('jobs_table_status_expired') }</Text>}
								{item.jobStatus.toUpperCase() === "ABORTED"    && <Text variation="Tertiary">{ t('jobs_table_status_aborted') }</Text>}
								{item.jobStatus.toUpperCase() === "FAILED"     && <Text variation="error">{ t('jobs_table_status_failed') }</Text>}
								{item.jobStatus.toUpperCase() === "TIMED_OUT"  && <Text variation="error">{ t('jobs_table_status_timed_out') }</Text>}
								{item.jobStatus.toUpperCase() === "COMPLETED"  &&
									<>
									<Button variation="primary" className="can-collapse" onClick={download} value={item.translateKey} download>{ t('jobs_table_status_download') }</Button>
									<Button variation="primary" className="is-collapsed" onClick={download} value={item.translateKey} download>&darr;</Button>
									</>
								}
							</TableCell>
						</TableRow>
					);
					})}
				</TableBody>
			</Table>
		}
		</View>
	)
};
