// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";
import * as cdk from "aws-cdk-lib";

import {
	aws_lambda as lambda,
	aws_stepfunctions as sfn,
	aws_logs as logs,
} from "aws-cdk-lib";

export interface props {
	nameSuffix: string;
	removalPolicy: cdk.RemovalPolicy;
	definition: sfn.IChainable;
}

export class dt_stepfunction extends Construct {
	public readonly lambdaFunction: lambda.Function;
	public readonly StateMachine: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		this.StateMachine = new sfn.StateMachine(
			this,
			`${cdk.Stack.of(this).stackName}_${props.nameSuffix}`,
			{
				stateMachineName: `${cdk.Stack.of(this).stackName}_${props.nameSuffix}`,
				logs: {
					destination: new logs.LogGroup(this, `${props.nameSuffix}`, {
						logGroupName: `/aws/vendedlogs/states/${
							cdk.Stack.of(this).stackName
						}/${props.nameSuffix}`,
						removalPolicy: props.removalPolicy, // ASM-CFN1
						retention: logs.RetentionDays.INFINITE,
					}),
					level: sfn.LogLevel.ALL,
				},
				tracingEnabled: true, // ASM-SF2
				definitionBody: sfn.DefinitionBody.fromChainable(props.definition),
			},
		);

		// Permissions
		// Permissions | Logging
		NagSuppressions.addResourceSuppressions(
			this.StateMachine,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Log destimation unknown at build time. Allow wildcard.",
					appliesTo: [
						"Action::logs:CreateLogDelivery",
						"Action::logs:GetLogDelivery",
						"Action::logs:UpdateLogDelivery",
						"Action::logs:DeleteLogDelivery",
						"Action::logs:ListLogDeliveries",
						"Action::logs:PutResourcePolicy",
						"Action::logs:DescribeResourcePolicies",
						"Action::logs:DescribeLogGroups",
						"Resource::*",
					],
				},
			],
			true,
		);
		// Permissions | XRay
		NagSuppressions.addResourceSuppressions(
			this.StateMachine,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "X-Ray destimation unknown at build time. Allow wildcard.",
					appliesTo: [
						"Action::xray:PutTraceSegments",
						"Action::xray:PutTelemetryRecords",
						"Action::xray:GetSamplingRules",
						"Action::xray:GetSamplingTarget",
						"Resource::*",
					],
				},
			],
			true,
		);
		// END
	}
}
