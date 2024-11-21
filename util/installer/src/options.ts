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
import { ConfigurationOptions } from "./configuration/options";

import { Config } from "../../../infrastructure/lib/types";

const mapConfig = (options: ConfigurationOptions): Config => {
	return {
		common: {
			instance: options.commonMiscOptions.common.instance,
			development: options.commonDevelopmentOptions.common.development,
		},
		pipeline: {
			source: {
				repoBranch: options.pipelineSourceOptions.pipeline.source.repoBranch,
				repoHook: {
					enable: options.pipelineSourceOptions.pipeline.source.repoHookEnable,
				},
				repoName: options.pipelineSourceOptions.pipeline.source.repoName,
				repoOwner: options.pipelineSourceOptions.pipeline.source.repoOwner,
			},
			approvals: options.pipelineApprovalOptions.pipeline.approvals,
			removalPolicy: options.commonDevelopmentOptions.pipeline.removalPolicy,
		},
		app: {
			removalPolicy: options.commonDevelopmentOptions.app.removalPolicy,
			cognito: {
				localUsers: {
					enable: options.appCognitoOptions.app.cognito.localUsers.enable,
					mfa: options.appCognitoOptions.app.cognito.localUsers.enable ? options.appCognitoLocalOptions.app.cognito.localUsers.mfa : {},
				},
				saml: {
					enable: options.appCognitoOptions.app.cognito.saml.enable,
					metadataUrl: options.appCognitoOptions.app.cognito.saml.enable ? options.appCognitoSamlOptions.app.cognito.saml.metadataUrl : undefined,
				},
			},
			webUi: options.appWebOptions.app.webUi,
			readable: options.appReadableOptions.app.readable,
			translation: options.appTranslationOptions.app.translation,
		},
	};
};

export const getConfigurationOptions = async (): Promise<Config> => {
	let result: any = {};

	result.commonMiscOptions = await getCommonMiscOptions();
	result.pipelineSourceOptions = await getPipelineSourceOptions(
		result.commonMiscOptions.common.instance.name
	);
	result.pipelineApprovalOptions = await getPipelineApprovalOptions();

	result.appCognitoOptions = await getAppCognitoOptions();
	result.appCognitoLocalOptions = result.appCognitoOptions.app.cognito
		.localUsers.enable
		? await getAppCognitoLocalOptions()
		: {};
	result.appCognitoSamlOptions = result.appCognitoOptions.app.cognito.saml
		.enable
		? await getAppCognitoSamlOptions()
		: {};

	result.appWebOptions = await getAppWebOptions();
	result.appTranslationOptions = await getAppTranslationOptions();
	result.appReadableOptions = await getAppReadableOptions();
	result.commonDevelopmentOptions = await getCommonDevelopmentOptions();

	return mapConfig(result);
};

const main = async () => {
	const result: Config = await getConfigurationOptions();
	console.log(JSON.stringify(result, null, 4));
	console.log("Completed");
};
if (require.main === module) main();
