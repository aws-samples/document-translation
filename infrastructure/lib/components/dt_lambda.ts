// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";
import * as cdk from "aws-cdk-lib";

import { aws_lambda as lambda, aws_iam as iam } from "aws-cdk-lib";

export interface props {
	role: iam.Role;
	path: string;
	description: string;
	environment?: { [key: string]: string } | undefined;
}

export class dt_lambda extends Construct {
	public readonly lambdaFunction: lambda.Function;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// FUNCTION
		this.lambdaFunction = new lambda.Function(this, "lambdaFuncion", {
			// UNIQUE
			role: props.role, // ASM-L7
			code: lambda.Code.fromAsset(props.path),
			description: props.description,
			environment: props.environment,
			// COMMON
			runtime: lambda.Runtime.NODEJS_16_X, // ASM-L1
			architecture: lambda.Architecture.ARM_64,
			handler: "index.handler",
			tracing: lambda.Tracing.ACTIVE, // ASM-SF2
		});
		NagSuppressions.addResourceSuppressions(
			this.lambdaFunction,
			[
				{
					id: "AwsSolutions-L1",
					reason:
						"Lambas use SDK v2 where as NodeJS Lambda ships with SDK v3. Requires Lambda update.",
				},
			],
			false
		);
		// PERMISSIONS
		const logGroupArn = `arn:aws:logs:${cdk.Stack.of(this).region}:${
			cdk.Stack.of(this).account
		}:log-group:${this.lambdaFunction.logGroup.logGroupName}`;

		// PERMISSIONS | LOGGING | CREATE
		const iamPolicyPermitLogging = new iam.Policy(
			this,
			"iamPolicyPermitLogging",
			{
				policyName: "CloudWatch-Logging",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["logs:CreateLogGroup"],
						resources: [`${logGroupArn}`],
					}),
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
						resources: [`${logGroupArn}:*`],
					}),
				],
			}
		);
		this.lambdaFunction.role?.attachInlinePolicy(iamPolicyPermitLogging);
		NagSuppressions.addResourceSuppressions(
			iamPolicyPermitLogging,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Scoped to Lambda specific log group. Allow wildcard.",
				},
			],
			true
		);

		// PERMISSIONS | XRAY
		NagSuppressions.addResourceSuppressions(
			props.role,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "X-Ray destimation unknown at build time. Allow wildcard.",
					appliesTo: [
						"Action::xray:PutTraceSegments",
						"Action::xray:PutTelemetryRecords",
						"Resource::*",
					],
				},
			],
			true
		);

		// END
	}
}
