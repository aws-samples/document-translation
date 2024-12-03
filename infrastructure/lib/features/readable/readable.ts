// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import { aws_appsync as appsync, aws_s3 as s3 } from "aws-cdk-lib";
import * as identitypool from "@aws-cdk/aws-cognito-identitypool-alpha";
import { CodeFirstSchema } from "awscdk-appsync-utils";

import { dt_readableBucket } from "./bucket";
import { dt_readableJob } from "./jobMetadata";
import { dt_readableModel } from "./model";
import { dt_readableItem } from "./jobItem";
import { dt_readableWorkflow } from "./workflow";
import { dt_readableWorkflowParseDoc } from "./parseDoc";
import { dt_readablePrintStyles } from "./printStyles";

export interface props {
	api: appsync.GraphqlApi;
	apiSchema: CodeFirstSchema;
	bedrockRegion: string;
	identityPool: identitypool.IdentityPool;
	removalPolicy: cdk.RemovalPolicy;
	serverAccessLoggingBucket: s3.Bucket;
}

export class dt_readable extends Construct {
	public readonly contentBucket: s3.Bucket;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// INFRA
		this.contentBucket = new dt_readableBucket(this, "contentBucket", {
			serverAccessLoggingBucket: props.serverAccessLoggingBucket,
			identityPool: props.identityPool,
			removalPolicy: props.removalPolicy,
		}).bucket;

		// FEATURES
		// FEATURES | JOB
		const readableJob = new dt_readableJob(this, "readableJob", {
			api: props.api,
			apiSchema: props.apiSchema,
			removalPolicy: props.removalPolicy,
		});

		// FEATURES | MODEL
		const readableModel = new dt_readableModel(this, "readableModel", {
			api: props.api,
			apiSchema: props.apiSchema,
			removalPolicy: props.removalPolicy,
		});

		// FEATURES | PRINTSTYLES
		new dt_readablePrintStyles(this, "readablePrintStyles", {
			api: props.api,
			apiSchema: props.apiSchema,
			removalPolicy: props.removalPolicy,
		});

		// API
		const readableItem = new dt_readableItem(this, "readableItem", {
			api: props.api,
			apiSchema: props.apiSchema,
			apiDsJobTable: readableJob.apiDsJobTable,
			jobTable: readableJob.jobTable,
			modelTable: readableModel.modelTable,
			removalPolicy: props.removalPolicy,
		});

		// WORKFLOW
		new dt_readableWorkflow(this, "readableWorkflow", {
			api: props.api,
			bedrockRegion: props.bedrockRegion,
			jobTable: readableJob.jobTable,
			modelTable: readableModel.modelTable,
			removalPolicy: props.removalPolicy,
			updateJobItemMutation_name: readableItem.updateJobItemMutation_name,
			contentBucket: this.contentBucket,
		});''

		// WORKFLOW
		new dt_readableWorkflowParseDoc(this, "readableWorkflowParseDoc", {
			api: props.api,
			apiSchema: props.apiSchema,
			contentBucket: this.contentBucket,
			createJobItemMutation_name: readableItem.createJobItemMutation_name,
			apiDsJobTable: readableJob.apiDsJobTable,
			jobTable: readableJob.jobTable,
			removalPolicy: props.removalPolicy,
			updateJobItemMutation_name: readableItem.updateJobItemMutation_name,
		});

		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a",
				).node.path
			}/ServiceRole/Resource`,
			[
				{
					id: "AwsSolutions-IAM4",
					reason:
						"CDK generates role with default policy. Default policy uses wildcard.",
				},
			],
			true,
		);
		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a",
				).node.path
			}/ServiceRole/DefaultPolicy/Resource`,
			[
				{
					id: "AwsSolutions-IAM5",
					reason:
						"CDK generates role with default policy. Default policy uses wildcard.",
				},
			],
			true,
		);

		// END
	}
}
