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
		const sourceGitBranch: string =
			process.env.sourceGitBranch !== undefined
				? process.env.sourceGitBranch
				: "main";

		const stackName = `DocTran-${sourceGitBranch}-app`;
		const docTranStackInstance = new DocTranStack(this, `${stackName}`, {
			stackName: `${stackName}`,
			description: `INDSOL-0e1ec93-App`,
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
