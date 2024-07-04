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

export interface pauseProps {
	removalPolicy: cdk.RemovalPolicy;
	pathToId: string;
}

export class dt_resumePause extends Construct {
	public readonly table: dynamodb.Table;
	public readonly task: tasks.CallAwsService;

	constructor(scope: Construct, id: string, props: pauseProps) {
		super(scope, id);

		this.table = new dynamodb.Table(this, "table", {
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
					TableName: this.table.tableName,
					Key: { id: { "S.$": props.pathToId } },
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
				iamResources: [this.table.tableArn],
			},
		);
	}
}

export interface workflowProps {
	stepFunction: sfn.StateMachine;
	pathToId: string;
	removalPolicy: cdk.RemovalPolicy;
	nameSuffix: string;
	table: dynamodb.Table;
	eventPattern: events.EventPattern;
}

export class dt_resumeWorkflow extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: workflowProps) {
		super(scope, id);

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
					sfn.JsonPath.stringAt(props.pathToId)
				)
			},
			table: props.table,
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
				id: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt(props.pathToId))
			},
			table: props.table,
		});

		// STATE MACHINE | MAIN | DEF
		this.sfnMain = new dt_stepfunction(
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
			this.sfnMain.role,
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

		eventRule.addTarget(new targets.SfnStateMachine(this.sfnMain));
		// END
	}
}