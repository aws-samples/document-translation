// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_s3 as s3,
	aws_iam as iam,
} from "aws-cdk-lib";
import { dt_stepfunction } from "../components/dt_stepfunction";

export interface props {
	namedStrings: { [key: string]: string };
	removalPolicy: cdk.RemovalPolicy;
	contentBucket: s3.Bucket;
}

export class dt_translationTag extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// STATE MACHINE
		//
		// STATE MACHINE | MAIN
		// STATE MACHINE | MAIN | TASKS
		const listObjects = new tasks.CallAwsService(this, "listObjects", {
			resultPath: "$.listObjects",
			service: "s3",
			action: "listObjectsV2",
			parameters: {
				Bucket: props.contentBucket.bucketName,
				Prefix: sfn.JsonPath.stringAt("$.jobDetails.s3PrefixToJobId"),
			},
			iamResources: [
				props.contentBucket.bucketArn,
				// 	props.contentBucket.bucketArn + "/*",
			],
		});

		const iterateObjects = new sfn.Map(this, "loopLangForTranslate", {
			resultPath: sfn.JsonPath.DISCARD,
			itemsPath: sfn.JsonPath.stringAt("$.listObjects.Contents"),
			parameters: {
				jobDetails: sfn.JsonPath.objectAt("$.jobDetails"),
				key: sfn.JsonPath.objectAt("$$.Map.Item.Value.Key"),
				piiResult: sfn.JsonPath.stringAt("$.piiResult"),
			},
		});

		const putObjectTagging = new tasks.CallAwsService(
			this,
			"putObjectTagging",
			{
				resultPath: sfn.JsonPath.DISCARD,
				service: "s3",
				action: "putObjectTagging",
				parameters: {
					Bucket: props.contentBucket.bucketName,
					"Key.$": "$.key",
					Tagging: {
						TagSet: [
							{
								Key: props.namedStrings.tagPii,
								"Value.$": "$.piiResult",
							},
						],
					},
				},
				iamResources: [
					props.contentBucket.bucketArn,
					props.contentBucket.bucketArn + "/*",
				],
			}
		);

		// STATE MACHINE | MAIN | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationTag`,
			{
				nameSuffix: "TranslationTag",
				removalPolicy: props.removalPolicy,
				definition: listObjects.next(iterateObjects.iterator(putObjectTagging)),
			}
		).StateMachine;

		const sfnMainRole = this.sfnMain.role;
		const policyPermitListObjectsS3 = new iam.Policy(
			this,
			"policyPermitListObjectsS3",
			{
				policyName: "List-S3-Objects-in-Content-Bucket",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["s3:ListBucket"],
						resources: [
							props.contentBucket.bucketArn,
							props.contentBucket.bucketArn + "/*",
						],
					}),
				],
			}
		);
		sfnMainRole?.attachInlinePolicy(policyPermitListObjectsS3);
		NagSuppressions.addResourceSuppressions(
			sfnMainRole,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						"Action::s3:ListBucket",
						"Resource::<basetranslatecontentBucketD9522F8D.Arn>/*", // See https://github.com/cdklabs/cdk-nag/issues/957
					],
				},
			],
			true
		);
		NagSuppressions.addResourceSuppressions(
			policyPermitListObjectsS3,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						"Action::s3:ListBucket",
						"Resource::<basetranslatecontentBucketD9522F8D.Arn>/*", // See https://github.com/cdklabs/cdk-nag/issues/957
					],
				},
			],
			true
		);

		// END
	}
}
