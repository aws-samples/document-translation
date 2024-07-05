// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_iam as iam,
	aws_dynamodb as dynamodb,
	aws_s3 as s3,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_events as events,
	aws_events_targets as targets,
} from "aws-cdk-lib";
import { dt_lambda } from "../../components/lambda";
import { dt_stepfunction } from "../../components/stepfunction";
import { dt_parseS3Key } from "./parseS3Key";

export interface props {
	namedStrings: { [key: string]: string };
	removalPolicy: cdk.RemovalPolicy;
	jobTable: dynamodb.Table;
	contentBucket: s3.Bucket;
}

export class dt_translationLifecycle extends Construct {
	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// EVENT HANDLER
		// EVENT HANDLER | STEP FUNCTION
		// EVENT HANDLER | STEP FUNCTION | TASKS
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key | TASK
		const parseS3KeySfn = new dt_parseS3Key(this, "parseS3KeySfn", {
			removalPolicy: props.removalPolicy,
		});
		const parseS3Key = new tasks.StepFunctionsStartExecution(
			this,
			"parseS3Key",
			{
				resultPath: "$.parseS3Key",
				stateMachine: parseS3KeySfn.sfnMain,
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					key: sfn.JsonPath.stringAt("$.detail.object.key"),
				}),
			},
		);

		// EVENT HANDLER | STEP FUNCTION | TASKS | updateDbStatus
		const updateDbStatus = new tasks.DynamoUpdateItem(this, "updateDbStatus", {
			table: props.jobTable,
			key: {
				id: tasks.DynamoAttributeValue.fromString(
					sfn.JsonPath.stringAt("$.parseS3Key.jobId.value"),
				),
			},
			updateExpression:
				"SET " + props.namedStrings.attributeForJobStatus + " = :value",
			expressionAttributeValues: {
				":value": tasks.DynamoAttributeValue.fromString(
					props.namedStrings.s3StageExpired,
				),
			},
		});
		// EVENT HANDLER | STEP FUNCTION | STATE MACHINE
		const sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationLifecycle`,
			{
				nameSuffix: "TranslationLifecycle",
				removalPolicy: props.removalPolicy,
				definition: parseS3Key.next(updateDbStatus),
			},
		);
		NagSuppressions.addResourceSuppressions(
			sfnMain,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
				},
			],
			true,
		);

		// EVENT
		const onDeleteObjectRule = new events.Rule(this, "onDeleteObjectRule", {
			description: "dt_translationLifecycle onDeleteObjectRule",
		});
		onDeleteObjectRule.addEventPattern({
			source: ["aws.s3"],
			detailType: ["Object Deleted"],
			detail: {
				bucket: {
					name: [props.contentBucket.bucketName],
				},
				object: {
					key: [{ prefix: "private/" }],
				},
			},
		});
		onDeleteObjectRule.addTarget(
			new targets.SfnStateMachine(sfnMain.StateMachine),
		);
		props.contentBucket.enableEventBridgeNotification();

		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"BucketNotificationsHandler050a0587b7544547bf325f094a3db834",
				).node.path
			}/Role/Resource`,
			[
				{
					id: "AwsSolutions-IAM4",
					appliesTo: [
						"Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
					],
					reason:
						"Custom Resource Lambda defined by CDK project for S3 EventBridge notifications",
				},
			],
			true,
		);
		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"BucketNotificationsHandler050a0587b7544547bf325f094a3db834",
				).node.path
			}/Role/DefaultPolicy/Resource`,
			[
				{
					id: "AwsSolutions-IAM5",
					appliesTo: ["Resource::*"],
					reason:
						"Custom Resource Lambda defined by CDK project for S3 EventBridge notifications",
				},
			],
			true,
		);

		// END
	}
}
