// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_s3 as s3,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_events as events,
	aws_events_targets as targets,
} from "aws-cdk-lib";
import { dt_stepfunction } from "../../components/stepfunction";

export interface props {
	namedStrings: { [key: string]: string };
	s3PrefixPrivate: string;
	removalPolicy: cdk.RemovalPolicy;
	stepFunctionArns: string[];
	jobTable: dynamodb.Table;
	contentBucket: s3.Bucket;
}

export class dt_translationErrors extends Construct {
	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// STATE MACHINE | ERRORS
		const onSfnExecutionStateNotSuccess = new events.Rule(
			this,
			"onSfnExecutionStateNotSuccess",
			{
				description: "dt_translationErrors onSfnExecutionStateNotSuccess",
				eventPattern: {
					source: ["aws.states"],
					detail: {
						status: ["FAILED", "TIMED_OUT", "ABORTED"],
						stateMachineArn: props.stepFunctionArns,
					},
				},
			},
		);

		// FAILURES & EXPIRY
		// FAILURES & EXPIRY | STATE MACHINE | TASK | stripLangCodeFromId
		const stripLangCodeFromId = new sfn.Pass(this, "stripLangCodeFromId", {
			resultPath: "$.stripJobId",
			parameters: {
				payload: sfn.JsonPath.stringSplit(
					sfn.JsonPath.stringAt("$.detail.name"),
					"_",
				),
			},
		});

		// FAILURES & EXPIRY | STATE MACHINE | TASK | updateDbStatus X
		const updateDbStatusX = new tasks.DynamoUpdateItem(
			this,
			"updateDbStatusX",
			{
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.stripJobId.payload[0]"),
					),
				},
				updateExpression:
					"SET " + props.namedStrings.attributeForJobStatus + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.detail.status"),
					),
				},
			},
		);

		// FAILURES & EXPIRY | STATE MACHINE | DEF
		const sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationErrors`,
			{
				nameSuffix: "TranslationErrors",
				removalPolicy: props.removalPolicy,
				definition: stripLangCodeFromId.next(updateDbStatusX),
			},
		).StateMachine;
		// Required for "RUN_JOB"
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

		// FAILURES & EXPIRY | EVENT BRIDGE
		onSfnExecutionStateNotSuccess.addTarget(
			new targets.SfnStateMachine(sfnMain),
		);

		// END
	}
}
