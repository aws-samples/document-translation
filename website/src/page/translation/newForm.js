// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// REACT
import React, { useEffect, useState } from 'react';
import { translationCreateJob as createJob } from '../../graphql/mutations';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useNavigate } from 'react-router-dom';
import {
	FcDocument,
	FcFinePrint,
	FcTodoList,
} from 'react-icons/fc';
// AMPLIFY
import { Auth, API, Storage } from 'aws-amplify';
// CLOUDSCAPE DESIGN
import "@cloudscape-design/global-styles/index.css"
import {
	TextContent,
	SpaceBetween,
	Header,
	Button,
	Form,
	FormField,
	Container,
	FileUpload,
	Select,
	Alert,
	Checkbox,
} from "@cloudscape-design/components";

// APP
import { v4 as uuid } from 'uuid'; 

// CONFIGURE
// CONFIGURE | AMPLIFY
const cfnOutputs = require("../../cfnOutputs.json");

const languagesSource = require("./languagesSource.json");
const languagesTarget = require("./languagesTarget.json");

function setDefaultSourceLanguage() {
	const fallbackLanguage = 'en';
	function getLanguage() {
		return i18n.language ||
			(typeof window !== 'undefined' && window.localStorage.i18nextLng) ||
			fallbackLanguage;
	};
	const language = getLanguage();
	const isLanguageSupported = languagesSource.find(item => item.value === language);
	if (isLanguageSupported) {
		return language;
	} else {
		return fallbackLanguage;
	}
}

const initialState = {
	jobIdentity: '',
	jobName: '',
	languageSource: setDefaultSourceLanguage(),
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
const supportedFileSizeBytes = supportedFileSizeKiloBytes * 1000;

export default function NewForm() {
	const navigate = useNavigate();
	/* Local state */
	const [formState, updateFormState] = useState(initialState)

	/* onChangeFile hanlder	*/
	function onChangeFile(file) {
		console.log("onChangeFile", file)
		// Verify a file is selected
		if (!file) {
			updateFormState(currentState => ({
				...currentState,
				document: {},
			}));
			return;
		};

		// Verify the file type is supported
		if (!supportedFileTypes.includes(file.type)) {
			updateFormState(currentState => ({
				...currentState,
				document: {},
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
		if (file.size > supportedFileSizeBytes) {
			updateFormState(currentState => ({
				...currentState,
				document: {},
				formErrors_unsupportedFileSize: true
			}));
			file = null;
			return;
		} else {
			updateFormState(currentState => ({
				...currentState,
				formErrors_unsupportedFileType: false,
				formErrors_unsupportedFileSize: false,
				formErrors_noOriginalDoc: false
			}));
		}

		const document = {
			fileInfo: file,
			name: `${file.name}`,
			type: `${file.type}`
		}
		updateFormState(currentState => ({
			...currentState,
			fileSource: URL.createObjectURL(file),
			document
		}))
		console.log(`Set "fileSource" to "${document.name}"`);
	}

	/* onChangeLanguageSource hanlder */
	function onChangeLanguageSource(selectedLanguage) {
		console.log(`Setting languageSource to "${selectedLanguage}`);
		updateFormState(currentState => ({
			...currentState,
			languageSource: selectedLanguage
		}));
	}

	function selectAllTargetLanguages() {
		languagesTarget.map(item => (
			onChangeLanguageTarget(true, item.value)
		))
	}

	function clearAllTargetLanguages() {
		languagesTarget.map(item => (
			onChangeLanguageTarget(false, item.value)
		))
	}

	/* onChangeLanguageTarget hanlder */
	function onChangeLanguageTarget(state, language) {
		console.log(`Setting target language "${language}" to "${state}"`);

		if (state) {
			updateFormState(currentState => ({
				...currentState,
				languageTargets: [...currentState.languageTargets, language],
			}))
		} else {
			updateFormState(currentState => ({
				...currentState,
				languageTargets: currentState.languageTargets.filter(lang => lang !== language),
			}))
		}
	}

	/* Remove source from target */
	async function removeSourceLanguageFromTargets(value) {
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
		if (
			formState.formErrors_noLanguageSource ||
			formState.formErrors_noLanguageTarget ||
			formState.formErrors_noOriginalDoc ||
			formState.formErrors_unsupportedFileType ||
			formState.formErrors_unsupportedFileSize
		) {
			return false;
		}

		try {
			const jobId = uuid();
			const {
				languageSource,
				languageTargets,
				document,
			} = formState;


			removeSourceLanguageFromTargets(languageSource);

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
					{
						level: "private",
						region: cfnOutputs.awsRegion,
						bucket: cfnOutputs.awsUserFilesS3Bucket,
					},
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
				translateStatus["lang" + element] = "Submitted"
				translateKey["lang" + element] = ""
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

			// Return to My Translation
			navigate("/translation/history");
		} catch (err) {
			console.log('error: ', err);
		}
	}

	function lookupLanguageLabel(language) {
		const languageLabel = languagesSource.find(item => item.value === language);
		return (languageLabel.label)
	}

	const { t } = useTranslation();

	return (
		<>
			{!formState.saving &&
				<form onSubmit={e => e.preventDefault()}>
					<SpaceBetween direction="vertical" size="xxl">
						<Form
							actions={
								<SpaceBetween direction="horizontal" size="xxl">
									<Button formAction="none" variant="link" onClick={(e) => navigate("/translation/history")}>{t('generic_cancel')}</Button>
									<Button variant="primary" onClick={save}>{t('generic_submit')}</Button>
								</SpaceBetween>
							}
						>
							<SpaceBetween direction="vertical" size="xxl">
								<Container header={
									<Header variant="h2">
										<FcDocument />&nbsp;{t('translation_new_original_document')}
									</Header>
								}
								>
									<FormField stretch>
										<SpaceBetween direction="vertical" size="xxl">
											<FileUpload
												onChange={({ detail }) => onChangeFile(detail.value[0])}
												value={formState.document.fileInfo ? [formState.document.fileInfo] : []}
												accept={supportedFileTypes}
												i18nStrings={{
													uploadButtonText: e =>
														e ? "Choose files" : "Choose file",
													dropzoneText: e =>
														e
															? "Drop files to upload"
															: "Drop file to upload",
													removeFileAriaLabel: e =>
														`Remove file ${e + 1}`,
													limitShowFewer: "Show fewer files",
													limitShowMore: "Show more files",
													errorIconAriaLabel: "Error",
												}}
												showFileLastModified
												showFileSize
												showFileThumbnail
												tokenLimit={3}
											/>
											{formState.formErrors_noOriginalDoc && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_original_document_error_no_doc')} />}
											{formState.formErrors_unsupportedFileType && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_original_document_error_unsupported_type')} />}
											{formState.formErrors_unsupportedFileSize && <Alert statusIconAriaLabel="Error" type="error" header={`${t('translation_new_original_document_error_too_large')} (${supportedFileSizeMegaBytes} MB/${supportedFileSizeKiloBytes} KB)`} />}
										</SpaceBetween>
									</FormField>
								</Container>
								<Container header={
									<Header variant="h2">
										<FcFinePrint />&nbsp;{t('translation_new_original_language')}
									</Header>
								}
								>
									<FormField stretch>
										<SpaceBetween direction="vertical" size="xxl">
											<Select
												selectedOption={{ value: formState.languageSource, label: (lookupLanguageLabel(formState.languageSource)) }}
												onChange={(e) => onChangeLanguageSource(e.detail.selectedOption.value)}
												options={languagesSource}
												filteringType="auto"
											/>
											{formState.formErrors_noLanguageSource && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_original_error_no_selection')} />}
										</SpaceBetween>
									</FormField>
								</Container>
								<Container header={
									<Header
										variant="h2"
										actions={
											<SpaceBetween direction="horizontal" size="xxl" >
												<Button onClick={selectAllTargetLanguages}>Select All</Button>
												<Button onClick={clearAllTargetLanguages}>Clear</Button>
											</SpaceBetween>
										}>
										<FcTodoList />&nbsp;{t('translation_new_target_languages')}
									</Header>
								}
								>
									<FormField stretch>
										<SpaceBetween direction="vertical" size="xxl">
											<ul className="list-can-collapse list-no-bullet">
												{languagesTarget.map((item, index) => (
													<React.Fragment key={index}>
														{index == 0 && <li className='languageTargetsSeparator'>{item.label[0].toLocaleUpperCase()}</li>}
														{index > 0 && item.label[0] !== languagesTarget[index - 1].label[0] && <li className='languageTargetsSeparator'>{item.label[0].toLocaleUpperCase()}</li>}
														<li>
															<Checkbox
																checked={formState.languageTargets.includes(item.value)}
																onChange={(e) => onChangeLanguageTarget(e.detail.checked, item.value)}
																value={item.value}
															>
																{item.label}
															</Checkbox>
														</li>
													</React.Fragment>
												))}
											</ul>
											{formState.formErrors_noLanguageTarget && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_target_languages_error_no_selection')} />}
										</SpaceBetween>
									</FormField>
								</Container>
							</SpaceBetween>
						</Form>
						{formState.formErrors_noOriginalDoc && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_original_document_error_no_doc')} />}
						{formState.formErrors_unsupportedFileType && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_original_document_error_unsupported_type')} />}
						{formState.formErrors_unsupportedFileSize && <Alert statusIconAriaLabel="Error" type="error" header={`${t('translation_new_original_document_error_too_large')} (${supportedFileSizeMegaBytes} MB/${supportedFileSizeKiloBytes} KB)`} />}
						{formState.formErrors_noLanguageSource && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_original_error_no_selection')} />}
						{formState.formErrors_noLanguageTarget && <Alert statusIconAriaLabel="Error" type="error" header={t('translation_new_target_languages_error_no_selection')} />}
					</SpaceBetween>
				</form>
			}
			{formState.saving &&
				<Container header={
					<Header variant="h2">
						<FcDocument />&nbsp;{t('translation_submit_submitting')}
					</Header>
				}>
					<TextContent>
						<SpaceBetween direction="vertical" size="xxl">
							{formState.status_validateInput && <p>{t('translation_submit_input_validated')}</p>}
							{formState.status_uploadDocument && <p>{t('translation_submit_document_uploaded')}</p>}
							{formState.status_submitJobInfo && <p>{t('translation_submit_input_submitted')}</p>}
							{formState.status_submitJobInfo && <h4>✅ {t('translation_submit_success')}</h4>}
						</SpaceBetween>
					</TextContent>
				</Container>
			}
		</>
	)
}