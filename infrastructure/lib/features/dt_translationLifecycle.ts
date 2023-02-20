// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_iam as iam,
	aws_dynamodb as dynamodb,
	aws_s3 as s3,
	aws_s3_notifications as s3n,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
} from "aws-cdk-lib";
import { dt_lambda } from "../components/dt_lambda";
import { dt_stepfunction } from "../components/dt_stepfunction";

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
		// EVENT HANDLER | STEP FUNCTION | TASKS | loopObjects
		const loopObjects = new sfn.Map(this, "loopObjects", {
			resultPath: "$.loopObjects",
			itemsPath: sfn.JsonPath.stringAt("$.Records"),
		});
		
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key | ROLE
		const parseS3KeyRole = new iam.Role(
			this,
			"parseS3KeyRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Parse S3 Key)",
			}
		);
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key | FUNCTION
		const lambdaParseS3Key = new dt_lambda(
			this,
			"lambdaParseS3Key",
			{
				role: parseS3KeyRole,
				path: "lambda/parseS3Key",
				description: "Parse S3 Key",
			}
		);
		// EVENT HANDLER | STEP FUNCTION | TASKS | parseS3Key | TASK
		const parseS3Key = new tasks.LambdaInvoke(
			this,
			"parseS3Key",
			{
				lambdaFunction: lambdaParseS3Key.lambdaFunction,
				resultSelector: {
					"parseS3Key.$": "$.Payload",
				},
			}
		);

		// EVENT HANDLER | STEP FUNCTION | TASKS | updateDbStatus
		const updateDbStatus = new tasks.DynamoUpdateItem(
			this,
			"updateDbStatus",
			{
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.parseS3Key.jobId")
					),
				},
				updateExpression:
					"SET " + props.namedStrings.attributeForJobStatus + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString(props.namedStrings.s3StageExpired),
				},
			}
		);
		// EVENT HANDLER | STEP FUNCTION | STATE MACHINE
		const sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationLifecycle`,
			{
				nameSuffix: "TranslationLifecycle",
				removalPolicy: props.removalPolicy,
				definition: loopObjects.iterator(
					parseS3Key
					.next(updateDbStatus)
				),
			}
		);
		NagSuppressions.addResourceSuppressions(
			sfnMain,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
				},
			],
			true
		);

		// EVENT PASS 
		// EVENT PASS | LAMBDA 
		// EVENT PASS | LAMBDA | ROLE
		const lambdaPassEventToStepFunctionRole = new iam.Role(
			this,
			"lambdaPassEventToStepFunctionRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description:
					"Lambda Role (Pass Event to StepFunction)",
			}
		); 
		// EVENT PASS | LAMBDA | FUNCTION
		const lambdaPassS3LifecycleToStepFunctionError = new dt_lambda(
			this,
			"lambdaPassS3LifecycleToStepFunctionError",
			{
				role: lambdaPassEventToStepFunctionRole,
				path: "lambda/passEventToStepFunction",
				description: "Pass Event to StepFunction",
				environment: {
					stateMachineArn: sfnMain.StateMachine.stateMachineArn,
				},
			}
		);

		// EVENT SOURCE
		// EVENT SOURCE | BUCKET NOTIFICATIONS
		// EVENT SOURCE | BUCKET NOTIFICATIONS | ADMIN DELETE
		props.contentBucket.addEventNotification(
			s3.EventType.OBJECT_REMOVED,
			new s3n.LambdaDestination(
				lambdaPassS3LifecycleToStepFunctionError.lambdaFunction
			)
		);
		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"BucketNotificationsHandler050a0587b7544547bf325f094a3db834"
				).node.path
			}/Role/Resource`,
			[
				{
					id: "AwsSolutions-IAM4",
					reason: "CDK managed policy without override option.",
				},
			],
			true
		);
		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"BucketNotificationsHandler050a0587b7544547bf325f094a3db834"
				).node.path
			}/Role/DefaultPolicy/Resource`,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "CDK managed policy without override option.",
				},
			],
			true
		);
		// EVENT SOURCE | BUCKET NOTIFICATIONS | LIFECYCLE DELETE
		props.contentBucket.addEventNotification(
			s3.EventType.LIFECYCLE_EXPIRATION,
			new s3n.LambdaDestination(
				lambdaPassS3LifecycleToStepFunctionError.lambdaFunction
			)
		);
		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"BucketNotificationsHandler050a0587b7544547bf325f094a3db834"
				).node.path
			}/Role/Resource`,
			[
				{
					id: "AwsSolutions-IAM4",
					reason: "CDK managed policy without override option.",
				},
			],
			true
		);
		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild(
					"BucketNotificationsHandler050a0587b7544547bf325f094a3db834"
				).node.path
			}/Role/DefaultPolicy/Resource`,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "CDK managed policy without override option.",
				},
			],
			true
		);

		// PERMISSIONS 
		// PERMISSIONS | EVENT PASS | LAMBDA | POLICY
		const permitStartExecutionOfStepFunction = new iam.Policy(this, "permitStartExecutionOfStepFunction", {
			policyName: "Start-Sfn-TranslationMain",
			statements: [
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["states:StartExecution"],
					resources: [sfnMain.StateMachine.stateMachineArn],
				}),
			],
		});
		lambdaPassEventToStepFunctionRole?.attachInlinePolicy(permitStartExecutionOfStepFunction);

		// END
	}
}
