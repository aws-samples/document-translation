import { AwsCdkCli } from "@aws-cdk/cli-lib-alpha";
import { ConfigurationOptions } from "../configuration/options";
import { putParameter } from "../util/parameterStore";

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
	const prefix = `/doctran/${config.commonMiscOptions.common_instance_name}/`;
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

const setConfigToEnvironment = (config: ConfigurationOptions) => {
	const flattenedConfig = flattenConfig(config);

	for (const [key, value] of Object.entries(flattenedConfig)) {
		process.env[key] = value?.toString();
		console.log(`Setting environment ${key}: '${process.env[key]}'`);
	}
};

type config = {
	configurationOptions: ConfigurationOptions;
	awsConfig: AwsConfig;
};

export const deploy = async (config: config) => {
	await saveConfigToParameterStore(config.configurationOptions);
	setConfigToEnvironment(config.configurationOptions);

	const cli = AwsCdkCli.fromCdkAppDirectory("../infrastructure");

	// Boostrap the accunt
	console.log("Bootstrapping CDK");
	await cli.bootstrap();
	// Deploy the stack
	console.log("Deploying the pipeline stack");
	await cli.deploy();
};
