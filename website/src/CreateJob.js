// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React			from 'react';
import { createJob }	from './graphql/mutations';
import { useTranslation } from 'react-i18next';
import {
	FcDocument,
	FcFinePrint,
	FcTodoList,
} from 'react-icons/fc';
// AMPLIFY
import { Auth, API, Storage } from 'aws-amplify';
import {
	useTheme,
	View,
	Heading,
	Card,
	Button,
	SelectField,
	Flex,
	Badge,
	Text,
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
// APP
import { v4 as uuid } from 'uuid';

const initialState = {
	jobIdentity: '',
	jobName: '',
	languageSource: 'en',
	languageTargets: [],
	document: {},
	contentType: '',
	fileSource: '',
	saving: false,
	status_validateInput: false,
	status_uploadDocument: false,
	status_submitJobInfo: false,
	formErrors_noLanguageSource: false,
	formErrors_noLanguageTarget: false,
	formErrors_noOriginalDoc: false,
	formErrors_unsupportedFileType: false,
	formErrors_unsupportedFileSize: false,
};
const supportedFileTypes = [
	'text/plain',
	'text/html',
	'application/x-xliff+xml',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
const supportedFileSizeMegaBytes = 20;
const supportedFileSizeKiloBytes = supportedFileSizeMegaBytes * 1000;
const supportedFileSizeBytes     = supportedFileSizeKiloBytes * 1000;

export default function CreateJob({
	updateJobs, jobs
}) {
	/* Local state */
	const [formState, updateFormState] = React.useState(initialState)

	/* onChangeFile hanlder	*/
	function onChangeFile(e) {

		// Verify a file is selected
		if (! e.target.files[0]) return;
		const selectedFile = e.target.files[0];

		// Verify the file type is supported
		if (! supportedFileTypes.includes(selectedFile.type) ) {
			updateFormState(currentState => ({
				...currentState,
				formErrors_unsupportedFileType: true
			}));
			return;
		} else {
			updateFormState(currentState => ({
				...currentState,
				formErrors_unsupportedFileType: false,
				formErrors_unsupportedFileSize: false,
				formErrors_noOriginalDoc: false
			}));
		}
		// Verify the file size is supported
		if ( selectedFile.size > supportedFileSizeBytes ) {
			updateFormState(currentState => ({
				...currentState,
				formErrors_unsupportedFileSize: true
			}));
			e.target.value = null;
			return;
		} else {
			updateFormState(currentState => ({
				...currentState,
				formErrors_unsupportedFileType: false,
				formErrors_unsupportedFileSize: false,
				formErrors_noOriginalDoc: false
			}));
		}

		// Document metadata
		const document = {
			fileInfo: selectedFile,
			name: `${selectedFile.name}`,
			type: `${selectedFile.type}`
		}
		// Save to state
		updateFormState(currentState => ({
			...currentState,
			fileSource: URL.createObjectURL(selectedFile),
			document
		}))
		// Output to console
		console.log('Set "fileSource" to "' + JSON.stringify(document.name) + '"');
	}

	/* onChangeLanguageSource hanlder */
	function onChangeLanguageSource(e) {
		const selectedLanguageSource = e.target.value;
		
		// Save to state
		updateFormState(currentState => ({
			...currentState,
			languageSource: selectedLanguageSource
		}));
		// Output to console
		console.log('Set "languageSource" to "' + selectedLanguageSource + '"');
	}

	/* onChangeLanguageTarget hanlder */
	function languageTargetsAll(e) {
		console.log('Set all "languageTargets" to', e.target.value)

		var languageTargets = [];
		const checkboxes = document.getElementsByClassName("languageTargetsCheckbox");
		
		for (let item of checkboxes) {

			if (e.target.value === "true") {
				languageTargets.push(item.value);
				item.checked = true;
			} else {
				item.checked = false;
			}
		}
		updateFormState(currentState => ({
			...currentState,
			languageTargets,
			formErrors_noLanguageTarget: false
		}));
		// Output to console
		console.log('Set "languageTargets" to "' + JSON.stringify(languageTargets) + '"');
	}

	/* onChangeLanguageTarget hanlder */
	function onChangeLanguageTarget(e) {

		var languageTargets = [];
        const checkboxes = document.getElementsByClassName("languageTargetsCheckbox");

		for (let item of checkboxes) {
			if (item.checked) {
                languageTargets.push(item.value);
            }
		}

		updateFormState(currentState => ({
			...currentState,
			languageTargets,
			formErrors_noLanguageTarget: false
		}));
		// Output to console
		console.log('Set "languageTargets" to "' + JSON.stringify(languageTargets) + '"');
	}

	/* Remove source from target */
	async function removeLanguageFromTargets(value) {
		const {
			languageTargets,
		} = formState;

		const index = languageTargets.indexOf(value);
		if (index > -1) {
			languageTargets.splice(index, 1);
		} 
	}

	/* Submit job */
	async function save() {
		try {
			const jobId = uuid();
			const {
				languageSource,
				languageTargets,
				document,
			} = formState;

			removeLanguageFromTargets(languageSource);

			// Verify required values provided
			// Verify | Original Doc
			if ( !document.name ) {
				updateFormState(currentState => ({
					...currentState,
					formErrors_noOriginalDoc: true
				}));
				return;
			} else {
				updateFormState(currentState => ({
					...currentState,
					formErrors_noOriginalDoc: false
				}));
			}
			// Verify | Language Source
			if ( !languageSource ) {
				updateFormState(currentState => ({
					...currentState,
					formErrors_noLanguageSource: true
				}));
				return;
			} else {
				updateFormState(currentState => ({
					...currentState,
					formErrors_noLanguageSource: false
				}));
			}
			// Verify | Language Target
			if ( languageTargets.length === 0 ) {
				updateFormState(currentState => ({
					...currentState,
					formErrors_noLanguageTarget: true
				}));
				return;
			} else {
				updateFormState(currentState => ({
					...currentState,
					formErrors_noLanguageTarget: false
				}));
			}

			// Save status to state
			updateFormState(currentState => ({
				...currentState,
				status_validateInput: true,
				saving: true
			}));

			// Upload file
			try {
				await Storage.put(
					jobId + "/upload/" + formState.document.name, // S3 Key/Path
					formState.document.fileInfo,                  // File
				);
			} catch (error) {
				console.log("Error uploading file");
				throw error;
			};

			// Save status to state
			updateFormState(currentState => ({
				...currentState,
				status_uploadDocument: true
			}));

			// Collate initial status
			const translateStatus = {};
			const translateKey = {};
			const translateCallback = {};
			languageTargets.forEach(element => {
				translateStatus["lang" + element]   = "Submitted"
				translateKey["lang" + element]      = ""
				translateCallback["lang" + element] = ""
			});

			// Job metadata
			const credentials = await Auth.currentUserCredentials();
			const jobIdentity = credentials.identityId;
			console.log("jobIdentity", jobIdentity);
			const jobInfo = {
				jobIdentity,
				id: jobId,
				jobName: document.name,
				languageSource,
				languageTargets: JSON.stringify([...new Set(languageTargets)]),
				contentType: document.type,
				translateStatus: JSON.stringify(translateStatus),
				translateKey: JSON.stringify(translateKey),
				translateCallback: JSON.stringify(translateCallback),
				jobStatus: "UPLOADED",
			};
			// Output to console
			console.log("Job info ");
			console.log(jobInfo)

			// Submit job info
			try {
				await API.graphql({
					query: createJob,
					variables: { input: jobInfo },
					authMode: 'AMAZON_COGNITO_USER_POOLS'
				});
			} catch (error) {
				console.log("Error uploading job info");
				throw error;
			};

			// Save status to state
			updateFormState(currentState => ({
				...currentState,
				status_submitJobInfo: true
			}));

			// Update local job info
			updateJobs([...jobs, {
				...jobInfo,
				document: formState.fileSource
			}]);

			// Return to My Translation
			window.open('/', '_self', 'noopener,noreferrer');
		} catch (err) {
			console.log('error: ', err);
		}
	}

	const { tokens } = useTheme();
	const { t } = useTranslation();

	return (
		<View
			backgroundColor={tokens.colors.background.secondary}
			padding={tokens.space.medium}
		>
			{ !formState.saving && 
				<div id="createJobForm">
					<Card variation="outlined" >
						<Heading level={5}>
							<FcDocument className="align-with-text" />
							<span className="align-with-text">&nbsp;{ t('original_document') }</span>
						</Heading>
						<input 
							type="file"
							accept="text/plain,text/html,application/x-xliff+xml,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
							onChange={onChangeFile}
						/>
					{ formState.formErrors_noOriginalDoc && <Text lineHeight="2em" variation="error"><Badge variation="error">Error</Badge>&nbsp;{ t('original_document_error_no_doc') }</Text>}
					{ formState.formErrors_unsupportedFileType && <Text lineHeight="2em" variation="error"><Badge variation="error">Error</Badge>&nbsp;{ t('original_document_error_unsupported_type') }</Text>}
					{ formState.formErrors_unsupportedFileSize && <Text lineHeight="2em" variation="error"><Badge variation="error">Error</Badge>&nbsp;{ t('original_document_error_too_large') } ({supportedFileSizeMegaBytes} MB/{supportedFileSizeKiloBytes} KB)</Text>}
					</Card>
					<Card variation="outlined">
						<Heading level={5}>
							<FcFinePrint className="align-with-text" />
							<span className="align-with-text">&nbsp;{ t('original_language') }</span>
						</Heading>
						<SelectField 
							descriptiveText={ t('original_language_help') }
							onChange={onChangeLanguageSource}
						>
							<option value="en">English (en) (default)</option>
							<option value="af">Afrikaans (af)</option>
							<option value="sq">Albanian (sq)</option>
							<option value="am">Amharic (am)</option>
							<option value="ar">Arabic (ar)</option>
							<option value="hy">Armenian (hy)</option>
							<option value="az">Azerbaijani (az)</option>
							<option value="bn">Bengali (bn)</option>
							<option value="bs">Bosnian (bs)</option>
							<option value="bg">Bulgarian (bg)</option>
							<option value="ca">Catalan (ca)</option>
							<option value="zh">Chinese (Simplified) (zh)</option>
							<option value="zh-TW">Chinese (Traditional) (zh-TW)</option>
							<option value="hr">Croatian (hr)</option>
							<option value="cs">Czech (cs)</option>
							<option value="da">Danish (da)</option>
							<option value="fa-AF">Dari (fa-AF)</option>
							<option value="nl">Dutch (nl)</option>
							<option value="et">Estonian (et)</option>
							<option value="fa">Farsi (Persian) (fa)</option>
							<option value="tl">Filipino, Tagalog (tl)</option>
							<option value="fi">Finnish (fi)</option>
							<option value="fr">French (fr)</option>
							<option value="fr-CA">French (Canada) (fr-CA)</option>
							<option value="ka">Georgian (ka)</option>
							<option value="de">German (de)</option>
							<option value="el">Greek (el)</option>
							<option value="gu">Gujarati (gu)</option>
							<option value="ht">Haitian Creole (ht)</option>
							<option value="ha">Hausa (ha)</option>
							<option value="he">Hebrew (he)</option>
							<option value="hi">Hindi (hi)</option>
							<option value="hu">Hungarian (hu)</option>
							<option value="is">Icelandic (is)</option>
							<option value="id">Indonesian (id)</option>
							<option value="ga">Irish (ga)</option>
							<option value="it">Italian (it)</option>
							<option value="ja">Japanese (ja)</option>
							<option value="kn">Kannada (kn)</option>
							<option value="kk">Kazakh (kk)</option>
							<option value="ko">Korean (ko)</option>
							<option value="lv">Latvian (lv)</option>
							<option value="lt">Lithuanian (lt)</option>
							<option value="mk">Macedonian (mk)</option>
							<option value="ms">Malay (ms)</option>
							<option value="ml">Malayalam (ml)</option>
							<option value="mt">Maltese (mt)</option>
							<option value="mr">Marathi (mr)</option>
							<option value="mn">Mongolian (mn)</option>
							<option value="no">Norwegian (no)</option>
							<option value="ps">Pashto (ps)</option>
							<option value="pl">Polish (pl)</option>
							<option value="pt">Portuguese (pt)</option>
							<option value="pt-PT">Portuguese (Portugal) (pt-PT)</option>
							<option value="pa">Punjabi (pa)</option>
							<option value="ro">Romanian (ro)</option>
							<option value="ru">Russian (ru)</option>
							<option value="sr">Serbian (sr)</option>
							<option value="si">Sinhala (si)</option>
							<option value="sk">Slovak (sk)</option>
							<option value="sl">Slovenian (sl)</option>
							<option value="so">Somali (so)</option>
							<option value="es">Spanish (es)</option>
							<option value="es-MX">Spanish (Mexico) (es-MX)</option>
							<option value="sw">Swahili (sw)</option>
							<option value="sv">Swedish (sv)</option>
							<option value="ta">Tamil (ta)</option>
							<option value="te">Telugu (te)</option>
							<option value="th">Thai (th)</option>
							<option value="tr">Turkish (tr)</option>
							<option value="uk">Ukrainian (uk)</option>
							<option value="ur">Urdu (ur)</option>
							<option value="uz">Uzbek (uz)</option>
							<option value="vi">Vietnamese (vi)</option>
							<option value="cy">Welsh (cy)</option>
						</SelectField>
					{ formState.formErrors_noLanguageSource && <Text lineHeight="2em" variation="error"><Badge variation="error">Error</Badge>&nbsp;{ t('original_language_error_no_selection') }</Text>}
					</Card>
					<Card variation="outlined">
						<Heading level={5}>
							<FcTodoList className="align-with-text" />
							<span className="align-with-text">&nbsp;{ t('target_languages') }</span>
						</Heading>
						<ul className="list-no-bullet list-can-collapse">
							{/* 
								<input type="checkbox">
								<span className="checkmark"></span>
							</label> */}
							<li className="languageTargetsSeparator">A</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="af"/>Afrikaans (af)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="sq"/>Albanian (sq)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="am"/>Amharic (am)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ar"/>Arabic (ar)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="hy"/>Armenian (hy)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="az"/>Azerbaijani (az)</label></li>
							<li className="languageTargetsSeparator">B</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="bn"/>Bengali (bn)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="bs"/>Bosnian (bs)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="bg"/>Bulgarian (bg)</label></li>
							<li className="languageTargetsSeparator">C</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ca"/>Catalan (ca)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="zh"/>Chinese (Simplified) (zh)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="zh-TW"/>Chinese (Traditional) (zh-TW)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="hr"/>Croatian (hr)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="cs"/>Czech (cs)</label></li>
							<li className="languageTargetsSeparator">D</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="da"/>Danish (da)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="fa-AF"/>Dari (fa-AF)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="nl"/>Dutch (nl)</label></li>
							<li className="languageTargetsSeparator">E</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="en"/>English (en)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="et"/>Estonian (et)</label></li>
							<li className="languageTargetsSeparator">F</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="fa"/>Farsi (Persian) (fa)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="tl"/>Filipino, Tagalog (tl)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="fi"/>Finnish (fi)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="fr"/>French (fr)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="fr-CA"/>French (Canada) (fr-CA)</label></li>
							<li className="languageTargetsSeparator">G</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ka"/>Georgian (ka)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="de"/>German (de)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="el"/>Greek (el)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="gu"/>Gujarati (gu)</label></li>
							<li className="languageTargetsSeparator">H</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ht"/>Haitian Creole (ht)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ha"/>Hausa (ha)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="he"/>Hebrew (he)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="hi"/>Hindi (hi)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="hu"/>Hungarian (hu)</label></li>
							<li className="languageTargetsSeparator">I</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="is"/>Icelandic (is)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="id"/>Indonesian (id)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ga"/>Irish (ga)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="it"/>Italian (it)</label></li>
							<li className="languageTargetsSeparator">J</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ja"/>Japanese (ja)</label></li>
							<li className="languageTargetsSeparator">K</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="kn"/>Kannada (kn)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="kk"/>Kazakh (kk)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ko"/>Korean (ko)</label></li>
							<li className="languageTargetsSeparator">L</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="lv"/>Latvian (lv)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="lt"/>Lithuanian (lt)</label></li>
							<li className="languageTargetsSeparator">M</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="mk"/>Macedonian (mk)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ms"/>Malay (ms)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ml"/>Malayalam (ml)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="mt"/>Maltese (mt)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="mr"/>Marathi (mr)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="mn"/>Mongolian (mn)</label></li>
							<li className="languageTargetsSeparator">N</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="no"/>Norwegian (no)</label></li>
							<li className="languageTargetsSeparator">P</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ps"/>Pashto (ps)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="pl"/>Polish (pl)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="pt"/>Portuguese (pt)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="pt-PT"/>Portuguese (Portugal) (pt-PT)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="pa"/>Punjabi (pa)</label></li>
							<li className="languageTargetsSeparator">R</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ro"/>Romanian (ro)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ru"/>Russian (ru)</label></li>
							<li className="languageTargetsSeparator">S</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="sr"/>Serbian (sr)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="si"/>Sinhala (si)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="sk"/>Slovak (sk)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="sl"/>Slovenian (sl)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="so"/>Somali (so)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="es"/>Spanish (es)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="es-MX"/>Spanish (Mexico) (es-MX)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="sw"/>Swahili (sw)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="sv"/>Swedish (sv)</label></li>
							<li className="languageTargetsSeparator">T</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ta"/>Tamil (ta)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="te"/>Telugu (te)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="th"/>Thai (th)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="tr"/>Turkish (tr)</label></li>
							<li className="languageTargetsSeparator">U</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="uk"/>Ukrainian (uk)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="ur"/>Urdu (ur)</label></li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="uz"/>Uzbek (uz)</label></li>
							<li className="languageTargetsSeparator">V</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="vi"/>Vietnamese (vi)</label></li>
							<li className="languageTargetsSeparator">W</li>
							<li><label className="languageTargetsLabel"><input type="checkbox" onChange={onChangeLanguageTarget} className="languageTargetsCheckbox" value="cy"/>Welsh (cy)</label></li>
						</ul>
						<div class="controls">
							<Button variation="link" size="small" onClick={languageTargetsAll} value={true} title="{ t('job_create_button_select_all') }">{ t('job_create_button_select_all') }</Button>
							<Button variation="link" size="small" onClick={languageTargetsAll} value={false} title="{ t('job_create_button_select_none') }">{ t('job_create_button_select_none') }</Button>
						</div>
					{ formState.formErrors_noLanguageTarget && <Text lineHeight="2em" variation="error"><Badge variation="error">Error</Badge>&nbsp;Please select at least one Target Tanguage to translate to.</Text>}
					</Card>
					<Flex
						direction="row"
						alignItems="flex-start"
						gap={tokens.space.xs}
					>
						<Button variation="primary" onClick={save} title="Submit">{ t('submit') }</Button>
					</Flex>
					{ formState.formErrors_noOriginalDoc && <Text lineHeight="2em" variation="error"><Badge variation="error">{ t('notice_tag_error') }</Badge>&nbsp;{ t('notice_error_no_original_doc') }</Text>}
					{ formState.formErrors_unsupportedFileType && <Text lineHeight="2em" variation="error"><Badge variation="error">{ t('notice_tag_error') }</Badge>&nbsp;{ t('notice_error_unsupported_file_type') }</Text>}
					{ formState.formErrors_unsupportedFileSize && <Text lineHeight="2em" variation="error"><Badge variation="error">{ t('notice_tag_error') }</Badge>&nbsp;{ t('notice_error_unsupported_file_size') }&nbsp;({supportedFileSizeMegaBytes} MB/{supportedFileSizeKiloBytes} KB).</Text>}
					{ formState.formErrors_noLanguageSource && <Text lineHeight="2em" variation="error"><Badge variation="error">{ t('notice_tag_error') }</Badge>&nbsp;{ t('notice_error_no_language_source') }</Text>}
					{ formState.formErrors_noLanguageTarget && <Text lineHeight="2em" variation="error"><Badge variation="error">{ t('notice_tag_error') }</Badge>&nbsp;{ t('notice_error_no_language_target') }</Text>}
				</div>
			}
			{ formState.saving &&
				<div id="submitJobInfo">
					<Card variation="outlined">
						<Heading level={5}>
							<FcDocument className="align-with-text" />
							<span className="align-with-text">&nbsp;{ t('submit_submitting_translation') }</span>
						</Heading>
						{ formState.status_validateInput  && <p>{ t('submit_input_validated') }</p> }
						{ formState.status_uploadDocument && <p>{ t('submit_document_uploaded') }</p> }
						{ formState.status_submitJobInfo  && <p>{ t('submit_input_submitted') }</p> }
						{ formState.status_submitJobInfo  && <h4>✅ { t('submit_success') }</h4> }
					</Card>
				</div>
			}
		</View>
	)
}