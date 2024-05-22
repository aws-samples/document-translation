// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_iam as iam,
	aws_dynamodb as dynamodb,
	aws_s3 as s3,
	// aws_s3_notifications as s3n,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_events as events,
	aws_events_targets as targets,
} from "aws-cdk-lib";
import { dt_lambda } from "../../components/lambda";
import { dt_stepfunction } from "../../components/stepfunction";

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
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key | ROLE
		const parseS3KeyRole = new iam.Role(this, "parseS3KeyRole", {
			// ASM-L6 // ASM-L8
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			description: "Lambda Role (Parse S3 Key)",
		});
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key | FUNCTION
		const lambdaParseS3Key = new dt_lambda(this, "lambdaParseS3Key", {
			role: parseS3KeyRole,
			path: "lambda/parseS3Key",
			description: "Parse S3 Key",
		});
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key | TASK
		const parseS3Key = new tasks.LambdaInvoke(this, "parseS3Key", {
			lambdaFunction: lambdaParseS3Key.lambdaFunction,
			resultSelector: {
				"parseS3Key.$": "$.Payload",
			},
		});

		// EVENT HANDLER | STEP FUNCTION | TASKS | updateDbStatus
		const updateDbStatus = new tasks.DynamoUpdateItem(this, "updateDbStatus", {
			table: props.jobTable,
			key: {
				id: tasks.DynamoAttributeValue.fromString(
					sfn.JsonPath.stringAt("$.parseS3Key.jobId"),
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
		onDeleteObjectRule.addTarget(new targets.SfnStateMachine(sfnMain.StateMachine));
		props.contentBucket.enableEventBridgeNotification();

		// END
	}
}
