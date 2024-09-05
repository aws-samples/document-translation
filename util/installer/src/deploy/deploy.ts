import { AwsCdkCli } from "@aws-cdk/cli-lib-alpha";
import fs from "fs/promises";
import { getAwsConfig, AwsConfig } from "../awsconfig";

import { Config } from "../../../../infrastructure/lib/types";

type configOptions = {
	config: Config;
	awsConfig: AwsConfig;
};

export const deploy = async (props: configOptions) => {
	const infraPath = "../../infrastructure";
	console.log(`Writing config to ${infraPath} to kickstart`);
	await fs.writeFile(
		`${infraPath}/config.json`,
		JSON.stringify(props.config, null, 4)
	);

	const cli = AwsCdkCli.fromCdkAppDirectory(infraPath);

	// Boostrap the accunt
	console.log("Bootstrapping CDK");
	await cli.bootstrap();
	// Deploy the stack
	console.log("Deploying the pipeline stack");
	const outputsFilePath = "cloudformation-outputs.json";
	await cli.deploy({
		outputsFile: outputsFilePath,
	});

	return outputsFilePath;
};

const main = async () => {
	const awsConfig: AwsConfig = await getAwsConfig();
	const config: Config = JSON.parse(await fs.readFile("config.json", "utf8"));
	const result: string = await deploy({ config, awsConfig });
	console.log(result);
	console.log("Completed");
};
if (require.main === module) main();
