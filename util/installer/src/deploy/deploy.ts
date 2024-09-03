import { AwsCdkCli } from "@aws-cdk/cli-lib-alpha";
import { ConfigurationOptions } from "../configuration/options";
import { putParameter } from "../util/parameterStore";
import fs from "fs/promises";

import { Config } from "../../../../infrastructure/lib/types";

export interface AwsConfig {
	account: string;
	region: string;
}

const flattenConfig = (config: ConfigurationOptions) => {
	// flatten config to just key value pairs
	return Object.entries(config).reduce(
		(acc, [key, value]) => ({ ...acc, ...value }),
		{}
	);
};

const saveConfigToParameterStore = async (config: ConfigurationOptions) => {
	const flattenedConfig = flattenConfig(config);
	// foo_bar_pie becomes "foo/bar/pie"
	const parameterConfig = Object.fromEntries(
		Object.entries(flattenedConfig).map(([key, value]) => [
			key.replace(/_/g, "/"),
			value,
		])
	);

	const overwrite = true;
	const prefix = `/doctran/${config.commonMiscOptions.common.instance.name}/`;
	for (const [key, value] of Object.entries(parameterConfig)) {
		if (value) {
			await putParameter(prefix, key, value.toString(), overwrite);
			// calculate 1 second plus up to 1 second of jitter
			const oneSecond = 1000;
			const jitter = Math.floor(Math.random() * oneSecond);
			await new Promise((resolve) => {
				setTimeout(resolve, oneSecond + jitter);
			});
		}
	}
};

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
					mfa: options.appCognitoLocalOptions.app.cognito.localUsers.mfa,
				},
				saml: {
					enable: options.appCognitoOptions.app.cognito.saml.enable,
					metadataUrl: options.appCognitoOptions.app.cognito.saml.metadataUrl,
				},
			},
			webUi: options.appWebOptions.app.webUi,
			readable: options.appReadableOptions.app.readable,
			translation: options.appTranslationOptions.app.translation,
		},
	};
};

type configOptions = {
	configurationOptions: ConfigurationOptions;
	awsConfig: AwsConfig;
};

export const deploy = async (options: configOptions) => {
	console.log("Saving configuration to Parameter Store");
	await saveConfigToParameterStore(options.configurationOptions);
	const config = mapConfig(options.configurationOptions);
	console.log("config", JSON.stringify(config, null, 4));

	const infraPath = "../../infrastructure";
	const cli = AwsCdkCli.fromCdkAppDirectory(infraPath);

	// Boostrap the accunt
	console.log("Bootstrapping CDK");
	await cli.bootstrap();
	// Deploy the stack
	console.log("Deploying the pipeline stack");
	// write config to ./ with fs
	await fs.writeFile(
		`${infraPath}/config.json`,
		JSON.stringify(config, null, 4)
	);
	await cli.deploy();
};
