// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AwsSolutionsChecks } from "cdk-nag";
import { DocTranStack } from "./doctran-stack";
import { Config } from "./types";
import { loadConfig } from "../util/loadConfig";

export class DocTranAppStage extends cdk.Stage {
	// OUTPUTS
	public readonly appStackId: cdk.CfnOutput;
	public readonly appStackName: cdk.CfnOutput;
	public readonly appWebsiteS3Bucket: cdk.CfnOutput;
	public readonly appWebsiteDistribution: cdk.CfnOutput;
	public readonly awsAppsyncId: cdk.CfnOutput;

	constructor(scope: Construct, id: string, props?: cdk.StageProps) {
		super(scope, id, props);

		const config: Config = loadConfig();

		const stackName = `DocTran-${config.common.instance.name}-app`;
		const docTranStackInstance = new DocTranStack(this, `${stackName}`, {
			stackName: `${stackName}`,
			description: `(uksb-1tthgi813) (tag:app)${config.app.translation.enable ? ' (tag:translation)' : ''}${config.app.readable.enable ? ' (tag:readable)' : ''}${config.app.webUi.enable ? ' (tag:webui)' : ''}`,
		});

		// Skip NAG for faster development testing
		const skipNag: boolean = 
		process.env.skipNag !== undefined 
			? process.env.skipNag.toLowerCase() === 'true'
			: false;

		if (!skipNag) {
			cdk.Aspects.of(docTranStackInstance).add(new AwsSolutionsChecks({ verbose: true }));
		} else {
			console.warn("\nSkipping cdk-nag as skipNag environment is true\n");
		}

		// OUTPUTS
		this.appStackId = docTranStackInstance.appStackId;
		this.appStackName = docTranStackInstance.appStackId;
		this.appWebsiteS3Bucket = docTranStackInstance.appWebsiteS3Bucket;
		this.appWebsiteDistribution = docTranStackInstance.appWebsiteDistribution;
		this.awsAppsyncId = docTranStackInstance.awsAppsyncId;
	}
}
