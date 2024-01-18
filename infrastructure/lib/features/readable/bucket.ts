// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import { aws_s3 as s3, aws_iam as iam } from "aws-cdk-lib";
import * as identitypool from "@aws-cdk/aws-cognito-identitypool-alpha";

import { Feature, Bucket } from "./enum";

export interface props {
	removalPolicy: cdk.RemovalPolicy;
	serverAccessLoggingBucket: s3.Bucket;
	identityPool: identitypool.IdentityPool;
}

export class dt_readableBucket extends Construct {
	public readonly bucket: s3.Bucket;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// IBucket
		this.bucket = new s3.Bucket(this, `bucket`, {
			objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // ASM-S2
			encryption: s3.BucketEncryption.S3_MANAGED, // ASM-S3
			enforceSSL: true, // ASM-S10
			versioned: true,
			serverAccessLogsBucket: props.serverAccessLoggingBucket, // ASM-S1
			serverAccessLogsPrefix: `${Feature.PREFIX}/content-bucket/`, // ASM-S1
			removalPolicy: props.removalPolicy, // ASM-CFN1
			cors: [
				{
					allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"],
					exposedHeaders: ["ETag"],
				},
			],
		});
		// PERMISSIONS
		const policyAuthenticatedPermitScopedS3 = new iam.Policy(
			this,
			"policyAuthenticatedPermitScopedS3",
			{
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM // ASM-COG7
						actions: ["s3:PutObject", "s3:GetObject"],
						resources: [
							`${this.bucket.bucketArn}/${Bucket.PREFIX_PRIVATE}/\${cognito-identity.amazonaws.com:sub}/*`,
						],
					}),
				],
			},
		);
		props.identityPool.authenticatedRole.attachInlinePolicy(
			policyAuthenticatedPermitScopedS3,
		);
		NagSuppressions.addResourceSuppressions(
			policyAuthenticatedPermitScopedS3,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Scoped to Cognito identity. Unknown file names uploaded",
					appliesTo: [
						"Action::s3:PutObject",
						"Action::s3:GetObject",
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							this.bucket.node.defaultChild as cdk.CfnElement,
						)}.Arn>/${
							Bucket.PREFIX_PRIVATE
						}/<cognito-identity.amazonaws.com:sub>/*`,
					],
				},
			],
			true,
		);

		// END
	}
}
