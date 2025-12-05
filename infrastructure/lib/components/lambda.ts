// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";
import * as cdk from "aws-cdk-lib";

import {
	aws_lambda as lambda,
	aws_iam as iam,
	aws_lambda_nodejs as nodejs,
} from "aws-cdk-lib";

export interface props {
	role?: iam.Role;
	path: string;
	description: string;
	environment?: { [key: string]: string } | undefined;
	runtime?: lambda.Runtime;
	architecture?: lambda.Architecture;
	bundlingNodeModules?: string[];
	timeout?: cdk.Duration;
}

export class dt_lambda extends Construct {
	public readonly lambdaFunction: lambda.Function;
	public readonly lambdaRole: iam.Role;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		const runtime: lambda.Runtime =
			props.runtime !== undefined ? props.runtime : lambda.Runtime.NODEJS_22_X; // ASM-L1

		const architecture: lambda.Architecture =
			props.architecture !== undefined
				? props.architecture
				: lambda.Architecture.ARM_64;

		// Create a role if not provided
		if (props.role) {
			this.lambdaRole = props.role;
		} else {
			this.lambdaRole = new iam.Role(this, "LambdaRole", {
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: `Lambda Role (${props.description})`,
			});
		}

		// FUNCTION
		this.lambdaFunction = new nodejs.NodejsFunction(this, "MyFunction", {
			// UNIQUE
			role: this.lambdaRole, // ASM-L7
			entry: `${props.path}/index.ts`,
			description: props.description,
			environment: props.environment,
			bundling: {
				nodeModules: props.bundlingNodeModules,
				externalModules: ["@aws-sdk/*"],
			},
			timeout: props.timeout,
			// COMMON
			depsLockFilePath: `${props.path}/package-lock.json`,
			runtime,
			architecture,
			handler: "index.handler",
			tracing: lambda.Tracing.ACTIVE, // ASM-SF2
		});
		NagSuppressions.addResourceSuppressions(
			this.lambdaFunction,
			[
				{
					id: "AwsSolutions-L1",
					reason:
						"Lambdas use SDK v2 where as NodeJS Lambda ships with SDK v3. Requires Lambda update.",
				},
			],
			false,
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
			},
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
			true,
		);

		// PERMISSIONS | XRAY
		NagSuppressions.addResourceSuppressions(
			this.lambdaRole,
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
			true,
		);

		// END
	}
}
