// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
} from "aws-cdk-lib";
import { dt_stepfunction } from "./stepfunction";

export interface tableProps {
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_resumeTable extends Construct {
	public readonly table: dynamodb.Table;

	constructor(scope: Construct, id: string, props: tableProps) {
		super(scope, id);

		this.table = new dynamodb.Table(this, "table", {
			partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: props.removalPolicy,
		});
		// END
	}
}

export interface pauseProps {
	removalPolicy: cdk.RemovalPolicy;
	pathToId: string;
	table: dynamodb.Table
}

export class dt_resumePauseTask extends Construct {
	public readonly task: tasks.CallAwsService;

	constructor(scope: Construct, id: string, props: pauseProps) {
		super(scope, id);

		this.task = new tasks.CallAwsService(
			this,
			"updateDbResumeToken",
			{
				resultPath: sfn.JsonPath.DISCARD,
				service: "dynamodb",
				action: "updateItem",
				integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
				parameters: {
					TableName: props.table.tableName,
					Key: { id: { "S.$": props.pathToId } },
					UpdateExpression: 'SET token = :taskToken',
					ExpressionAttributeValues: {
						':taskToken': sfn.JsonPath.taskToken,
					},
				},
				iamResources: [props.table.tableArn],
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
			key: {
				id: tasks.DynamoAttributeValue.fromString(
					sfn.JsonPath.stringAt(props.pathToId)
				)
			},
			table: props.table,
		});

		// STATE MACHINE | RESUME | TASKS | sendTaskSuccess
		const sendTaskSuccess = new tasks.CallAwsService(this, "sendTaskSuccess", {
			service: "sfn",
			action: "sendTaskSuccess",
			parameters: {
				TaskToken: sfn.JsonPath.stringAt("$.token.S"),
				Output: {
					Payload: sfn.JsonPath.stringAt("$.payload"),
				},
			},
			iamResources: [
				`arn:aws:states:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`,
			]
		});

		// STATE MACHINE | RESUME | TASKS | getResumeToken
		const deleteResumeToken = new tasks.DynamoDeleteItem(this, 'deleteResumeToken', {
			key: {
				id: tasks.DynamoAttributeValue.fromString(props.pathToId)
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

		// END
	}
}