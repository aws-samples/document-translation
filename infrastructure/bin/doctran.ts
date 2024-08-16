// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { pipelineStack } from "../lib/pipeline-stack";

// ENVIRONMENT VARIABLES
// ENVIRONMENT VARIABLES | GITHUB REPO
const instanceName: string =
	process.env.instanceName !== undefined ? process.env.instanceName : "main";

const app = new cdk.App();
const stackName = `DocTran-${instanceName}-pipeline`;
new pipelineStack(app, `${stackName}`, {
	stackName: `${stackName}`,
	description: `(uksb-1tthgi813) (tag:pipeline)`,
	env: {
		account: app.account,
		region: app.region,
	},
});

cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
app.synth();
