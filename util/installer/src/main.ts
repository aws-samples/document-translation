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
	const configurationOptions = await getConfigurationOptions();

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
