import { AwsCdkCli } from "@aws-cdk/cli-lib-alpha";

import { githubOptions } from "./shared.github";
import { userOptions } from "./shared.users";
import { cognitoUserOptions } from "./shared.users.cognito";
import { samlUserOptions } from "./shared.users.saml";
import { webOptions } from "./shared.web";
import { translationOptions } from "./translation";
import { readableOptions } from "./readable";
import { developmentOptions } from "./development";

export type awsConfig = {
	account: string;
	region: string;
};

export type appConfig = {
	github: githubOptions;
	users: userOptions;
	users_cognito: cognitoUserOptions;
	users_saml: samlUserOptions;
	web: webOptions;
	translation: translationOptions;
	readable: readableOptions;
	development: developmentOptions;
};

const parseAppConfig = (config: appConfig) => {
	const envVarMap = {
		// Cognito
		cognitoLocalUsers: config.users.cognitoUsers,
		cognitoLocalUsersMfa: config.users_cognito.cognitoMfa,
		cognitoLocalUsersMfaOtp: config.users_cognito.cognitoMfaOtp,
		cognitoLocalUsersMfaSms: config.users_cognito.cognitoMfaSms,
		// SAML
		cognitoSamlUsers: config.users.samlUsers,
		cognitoSamlMetadataUrl: config.users.samlUsers,
		// Readable
		readable: config.readable.readable,
		readableBedrockRegion: config.readable.readableBedrockRegion,
		// Source
		sourceRepoHook: config.github.repoHook,
		sourceGitRepo: config.github.repoOwner + "/" + config.github.repoName,
		// instanceName: config.github.repoBranch,
		// Translation
		translation: config.translation.translation,
		translationPii: config.translation.translationPii,
		translationLifecycleDefault: config.translation.translationLifecycleDefault,
		translationLifecyclePii: config.translation.translationLifecyclePii,
		// Web
		webUi: config.web.webUi,
		webUiCustomDomain: config.web.customDomain,
		webUiCustomDomainCertificate: config.web.customDomainArn,
		// Development
		development: config.development.development,
		appRemovalPolicy: config.development.appRemovalPolicy,
		pipelineRemovalPolicy: config.development.pipelineRemovalPolicy,
	};

	for (const [key, value] of Object.entries(envVarMap)) {
		if (value) {
			process.env[key] = value.toString();
		}
	}
};

type config = {
	appConfig: appConfig;
	awsConfig: awsConfig;
};

export const deploy = async (config: config) => {
	parseAppConfig(config.appConfig);
	const cli = AwsCdkCli.fromCdkAppDirectory("../infrastructure");

	// Boostrap the accunt
	console.log("Bootstrapping CDK");
	await cli.bootstrap();
	// Deploy the stack
	console.log("Deploying the pipeline stack");
	await cli.deploy();
};
