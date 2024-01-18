// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_iam as iam,
} from "aws-cdk-lib";
import { dt_stepfunction } from "./stepfunction";

export interface props {
	nameSuffix: string;
	jobTable: dynamodb.Table;
	removalPolicy: cdk.RemovalPolicy;
	// Matching upstream type
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dbCallbackParameters: { [key: string]: any } | undefined;
}

export class dt_callback extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// STATE MACHINE
		//
		// STATE MACHINE | CALLBACKSEND
		// STATE MACHINE | CALLBACKSEND | TASKS
		// STATE MACHINE | CALLBACKSEND | TASKS | getDbCallback - Get Callback token from dynamo DB
		const getDbCallback = new tasks.CallAwsService(this, "getDbCallback", {
			service: "dynamodb",
			action: "getItem",
			resultPath: "$.getDBCallback",
			parameters: props.dbCallbackParameters,
			iamResources: [props.jobTable.tableArn],
		});
		// STATE MACHINE | CALLBACKSEND | TASKS | taskTokenRef - Convert string to array
		const taskTokenRef = new sfn.Pass(this, "taskTokenRef", {
			resultPath: "$.taskTokenRef",
			parameters: {
				"value.$":
					"States.StringToJson(States.Format('{}', $.getDBCallback.Item..S))",
			},
		});

		// STATE MACHINE | CALLBACKSEND | TASKS | sendTaskSuccess - Send success token to state machine
		const sendTaskSuccess = new tasks.CallAwsService(this, "sendTaskSuccess", {
			service: "sfn",
			action: "sendTaskSuccess",
			parameters: {
				TaskToken: sfn.JsonPath.stringAt("$.taskTokenRef.value[0]"),
				Output: {
					Payload: sfn.JsonPath.stringAt("$.payload"),
				},
			},
			iamResources: [
				`arn:aws:states:${cdk.Stack.of(this).region}:${
					cdk.Stack.of(this).account
				}:*`,
			],
		});

		// STATE MACHINE | MAIN | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_${props.nameSuffix}`,
			{
				nameSuffix: props.nameSuffix,
				removalPolicy: props.removalPolicy,
				definition: getDbCallback.next(taskTokenRef).next(sendTaskSuccess),
			},
		).StateMachine;

		const permitSfnSendSuccess = new iam.Policy(this, "permitSfnSendSuccess", {
			policyName: "Send-Sfn-task-success-to-Sfn-Service",
			statements: [
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["states:sendTaskSuccess"],
					resources: [
						`arn:aws:states:${cdk.Stack.of(this).region}:${
							cdk.Stack.of(this).account
						}:*`,
					],
				}),
			],
		});
		this.sfnMain.role.attachInlinePolicy(permitSfnSendSuccess);

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
		NagSuppressions.addResourceSuppressions(
			permitSfnSendSuccess,
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
