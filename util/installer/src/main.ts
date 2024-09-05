import { deploy } from "./deploy/deploy";
import { monitorCodepipeline } from "./deploy/monitor.codepipeline";

import { getConfigurationOptions } from "./options";
import { prerequisites } from "./prerequisites";
import { getAwsConfig } from "./awsconfig";
import { saveConfigToParameterStore } from "./parameters";

const main = async () => {
	const awsConfig = await getAwsConfig();
	console.log("AwsConfig:", awsConfig);

	const config = await getConfigurationOptions();

	prerequisites(config);

	await saveConfigToParameterStore(config);
	const outputsPath: string = await deploy({
		config,
		awsConfig,
	});

	await monitorCodepipeline(
		config.common.instance.name,
		`../../infrastructure/${outputsPath}`,
		awsConfig.region
	);
};

main();
