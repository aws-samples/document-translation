// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AwsSolutionsChecks } from "cdk-nag";
import { DocTranStack } from "./doctran-stack";

export class DocTranAppStage extends cdk.Stage {
	// OUTPUTS
	public readonly appStackId: cdk.CfnOutput;
	public readonly appStackName: cdk.CfnOutput;
	public readonly appWebsiteS3Bucket: cdk.CfnOutput;
	public readonly appWebsiteDistribution: cdk.CfnOutput;
	public readonly awsAppsyncId: cdk.CfnOutput;

	constructor(scope: Construct, id: string, props?: cdk.StageProps) {
		super(scope, id, props);

		// ENVIRONMENT VARIABLES
		// ENVIRONMENT VARIABLES | GITHUB REPO
		const instanceName: string =
			process.env.instanceName !== undefined
				? process.env.instanceName
				: "main";

		const stackName = `DocTran-${instanceName}-app`;
		const docTranStackInstance = new DocTranStack(this, `${stackName}`, {
			stackName: `${stackName}`,
			description: `(uksb-1tthgi813) (tag:app)`,
		});

		cdk.Aspects.of(docTranStackInstance).add(
			new AwsSolutionsChecks({ verbose: true }),
		);

		// OUTPUTS
		this.appStackId = docTranStackInstance.appStackId;
		this.appStackName = docTranStackInstance.appStackId;
		this.appWebsiteS3Bucket = docTranStackInstance.appWebsiteS3Bucket;
		this.appWebsiteDistribution = docTranStackInstance.appWebsiteDistribution;
		this.awsAppsyncId = docTranStackInstance.awsAppsyncId;
	}
}
