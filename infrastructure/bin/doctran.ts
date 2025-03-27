// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { pipelineStack } from "../lib/pipeline-stack";
import { Config } from "../lib/types";
import { loadConfig } from "../util/loadConfig";

const config: Config = loadConfig();

const app = new cdk.App();
const stackName = `DocTran-${config.common.instance.name}-pipeline`;
new pipelineStack(app, `${stackName}`, {
	stackName: `${stackName}`,
	description: `(uksb-1tthgi813) (tag:pipeline)`,
	env: {
		account: app.account,
		region: app.region,
	},
});

// Skip NAG for faster development testing
const skipNag: boolean = 
	process.env.skipNag !== undefined 
		? process.env.skipNag.toLowerCase() === 'true'
		: false;

if (!skipNag) {
	cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
} else {
	console.warn("\nSkipping cdk-nag as skipNag environment is true\n");
}

app.synth();
