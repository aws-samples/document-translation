// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_events as events,
	aws_events_targets as targets,
} from "aws-cdk-lib";
import { dt_stepfunction } from "./stepfunction";

export interface props {
	pathToIdPauseTask: string;
	pathToIdWorkflow: string;
	removalPolicy: cdk.RemovalPolicy;
	nameSuffix: string;
	eventPattern: events.EventPattern;
}

export class dt_resumeWorkflow extends Construct {
	public readonly task: tasks.CallAwsService;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		const table = new dynamodb.Table(this, "table", {
			partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: props.removalPolicy,
		});

		this.task = new tasks.CallAwsService(
			this,
			"updateDbResumeToken",
			{
				resultPath: sfn.JsonPath.DISCARD,
				service: "dynamodb",
				action: "updateItem",
				integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
				parameters: {
					TableName: table.tableName,
					Key: { id: { "S.$": props.pathToIdPauseTask } },
					UpdateExpression: 'SET #taskToken = :taskToken',
					ExpressionAttributeNames: {
						'#taskToken': "token",
					},
					ExpressionAttributeValues: {
						':taskToken': {
							"S": sfn.JsonPath.taskToken,
						}
					},
				},
				iamResources: [table.tableArn],
			},
		);

		//
		// STATE MACHINE
		//
		// STATE MACHINE | RESUME
		// STATE MACHINE | RESUME | TASKS
		// STATE MACHINE | RESUME | TASKS | getResumeToken
		const getResumeToken = new tasks.DynamoGetItem(this, 'getResumeToken', {
			resultPath: "$.getResumeToken",
			key: {
				id: tasks.DynamoAttributeValue.fromString(
					sfn.JsonPath.stringAt(props.pathToIdWorkflow)
				)
			},
			table: table,
		});

		// STATE MACHINE | RESUME | TASKS | sendTaskSuccess
		const sendTaskSuccess = new tasks.CallAwsService(this, "sendTaskSuccess", {
			resultPath: "$.sendTaskSuccess",
			service: "sfn",
			action: "sendTaskSuccess",
			parameters: {
				TaskToken: sfn.JsonPath.stringAt("$.getResumeToken.Item.token.S"),
				Output: {
					jobStatus: sfn.JsonPath.stringAt("$.detail.jobStatus"),
				},
			},
			iamResources: [
				`arn:aws:states:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`,
			]
		});

		// STATE MACHINE | RESUME | TASKS | deleteResumeToken
		const deleteResumeToken = new tasks.DynamoDeleteItem(this, 'deleteResumeToken', {
			key: {
				id: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt(props.pathToIdWorkflow))
			},
			table: table,
		});

		// STATE MACHINE | MAIN | DEF
		const sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_${props.nameSuffix}`,
			{
				nameSuffix: props.nameSuffix,
				removalPolicy: props.removalPolicy,
				definition: getResumeToken
					.next(sendTaskSuccess)
					.next(deleteResumeToken),
			},
		).StateMachine;

		NagSuppressions.addResourceSuppressions(
			sfnMain.role,
			[
				{
					id: "AwsSolutions-IAM5",
					reason:
						"The action does not support resource-level permissions and require you to choose All resources. Token is tied to a single Sfn Execution",
					appliesTo: [
						"Resource::arn:aws:states:<AWS::Region>:<AWS::AccountId>:*",
					],
				},
			],
			true,
		);

		// EVENT RULE
		const eventRule = new events.Rule(this, "resumeRule", {
			description: `${props.nameSuffix} sfnResume`,
			eventPattern: props.eventPattern
		});

		eventRule.addTarget(new targets.SfnStateMachine(sfnMain));
		// END
	}
}