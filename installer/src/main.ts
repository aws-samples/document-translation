import { getCommonMiscOptions } from "./configuration/common.misc";
import { getPipelineSourceOptions } from "./configuration/pipeline.source";
import { getPipelineApprovalOptions } from "./configuration/pipeline.approvals";
import { getAppCognitoOptions } from "./configuration/app.cognito";
import { getAppCognitoLocalOptions } from "./configuration/app.cognito.local";
import { getAppCognitoSamlOptions } from "./configuration/app.cognito.saml";
import { getAppWebOptions } from "./configuration/app.webUi";
import { getAppTranslationOptions } from "./configuration/app.translation";
import { getAppReadableOptions } from "./configuration/app.readable";
import { getCommonDevelopmentOptions } from "./configuration/common.development";
import {
	ConfigurationOptions,
	cognitoMfaOption,
} from "./configuration/options";

import { prereqCdk } from "./deploy/prereq.cdk";
import { prereqTranslation } from "./deploy/prereq.translationPii";

import { deploy, AwsConfig } from "./deploy/deploy";
import { getAccountId, getRegionId } from "./util/getAccountDetails";

import { monitorCodepipeline } from "./deploy/monitor.codepipeline";

const getConfigurationOptions = async (): Promise<ConfigurationOptions> => {
	let result: any = {};

	result.commonMiscOptions = await getCommonMiscOptions();
	result.pipelineSourceOptions = await getPipelineSourceOptions(
		result.commonMiscOptions.common_instance_name
	);
	result.pipelineApprovalOptions = await getPipelineApprovalOptions();

	result.appCognitoOptions = await getAppCognitoOptions();
	result.appCognitoLocalOptions = result.appCognitoOptions
		.app_cognito_localUsers_enable
		? await getAppCognitoLocalOptions()
		: {};
	result.appCognitoSamlOptions = result.appCognitoOptions
		.app_cognito_saml_enable
		? await getAppCognitoSamlOptions()
		: {};

	result.appWebOptions = await getAppWebOptions();
	result.appTranslationOptions = await getAppTranslationOptions();
	result.appReadableOptions = await getAppReadableOptions();
	result.commonDevelopmentOptions = await getCommonDevelopmentOptions();

	return result;
};

const prerequisites = async (configurationOptions: ConfigurationOptions) => {
	prereqCdk();

	if (configurationOptions.appTranslationOptions.app_translation_pii_enable) {
		await prereqTranslation();
	}
};

const main = async () => {
	const awsConfig: AwsConfig = {
		account: await getAccountId(),
		region: await getRegionId(),
	};
	console.log("AwsConfig:", awsConfig);

	// Get Options
	// const configurationOptions = await getConfigurationOptions();
	// console.log("AppConfig:", configurationOptions);

	// TEST
	const configurationOptions: ConfigurationOptions = {
		commonMiscOptions: { common_instance_name: "main" },
		pipelineSourceOptions: {
			pipeline_source_repoOwner: "aws-samples",
			pipeline_source_repoName: "document-translation",
			pipeline_source_repoBranch: "release/test",
			pipeline_source_repoHookEnable: false,
			pipeline_source_repoPeriodicChecksEnable: true,
			pipeline_source_repoTokenName: "doctran-main-oauth-token-1724924907",
		},
		pipelineApprovalOptions: { pipeline_approvals_preCdkSynth_enable: false },
		appCognitoOptions: {
			app_cognito_localUsers_enable: true,
			app_cognito_saml_enable: false,
		},
		appCognitoLocalOptions: {
			app_cognito_localUsers_mfa_enforcement: cognitoMfaOption.OFF,
			app_cognito_localUsers_mfa_otp: false,
			app_cognito_localUsers_mfa_sms: false,
		},
		appCognitoSamlOptions: {},
		appWebOptions: {
			app_webUi_enable: true,
			app_webUi_customDomain_enable: false,
		},
		appTranslationOptions: {
			app_translation_enable: true,
			app_translation_lifecycle: 7,
			app_translation_pii_enable: true,
			app_translation_pii_lifecycle: 7,
		},
		appReadableOptions: {
			app_readable_enable: true,
			app_readable_bedrockRegion: "eu-west-2",
		},
		commonDevelopmentOptions: {
			common_development_enable: true,
			app_removalPolicy: "DELETE",
			pipeline_removalPolicy: "DELETE",
		},
	};
	// TEST

	// Prerequisites
	prerequisites(configurationOptions);

	// Deploy
	await deploy({
		configurationOptions,
		awsConfig,
	});

	// Monitor codepipeline
	await monitorCodepipeline();
};

main();
