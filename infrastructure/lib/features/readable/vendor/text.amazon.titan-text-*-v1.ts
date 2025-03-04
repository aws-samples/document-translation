// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_lambda as lambda,
} from "aws-cdk-lib";

import { dt_stepfunction } from "../../../components/stepfunction";

export interface props {
	converseBedrockLambda: lambda.Function;
	removalPolicy: cdk.RemovalPolicy;
}

enum Strings {
	modelVendor = "amazon",
	modelType = "text",
	modelNamePrefix = "titan-text-",
}

export class dt_readableWorkflow extends Construct {
	public readonly invokeModel: tasks.StepFunctionsStartExecution;
	public readonly modelChoiceCondition: sfn.Condition;
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// STATE MACHINE
		// STATE MACHINE | TASKS
		// STATE MACHINE | TASKS | createPrompt
		const createPrompt = new sfn.Pass(this, "createPrompt", {
			resultPath: "$.createPrompt",
			parameters: {
				inputText: sfn.JsonPath.format(
					"{}\n\n{}",
					sfn.JsonPath.stringAt("$.jobDetails.prePrompt"),
					sfn.JsonPath.stringAt("$.jobDetails.input"),
				),
			},
		});
		// STATE MACHINE | TASKS | createBody
		const createBody = new sfn.Pass(this, "createBody", {
			resultPath: "$.createBody",
			parameters: {
				payload: sfn.JsonPath.jsonMerge(
					sfn.JsonPath.objectAt("$.createPrompt"),
					sfn.JsonPath.objectAt("$.jobDetails.parameters"),
				),
			},
		});

		// STATE MACHINE | TASKS | converseBedrock
		const converseBedrock = new tasks.LambdaInvoke(this, "converseBedrock", {
			lambdaFunction: props.converseBedrockLambda,
			resultPath: "$.converseBedrock",
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			payload: sfn.TaskInput.fromObject({
				ModelId: sfn.JsonPath.objectAt("$.jobDetails.modelId"),
				Body: sfn.JsonPath.stringAt("$.createBody.payload"),
			}),
		});

		// STATE MACHINE | TASKS | filterOutput
		const filterOutput = new sfn.Pass(this, "filterOutput", {
			parameters: {
				payload: sfn.JsonPath.stringAt(
					"$.converseBedrock.Payload.Body.results[0].outputText",
				),
			},
		});

		// STATE MACHINE | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_Readable_${Strings.modelVendor}_${
				Strings.modelType
			}`,
			{
				nameSuffix: `Readable_${Strings.modelVendor}_${Strings.modelType}`,
				removalPolicy: props.removalPolicy,
				definition: createPrompt
					.next(createBody)
					.next(converseBedrock)
					.next(filterOutput),
			},
		).StateMachine;
		NagSuppressions.addResourceSuppressions(
			this.sfnMain,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							props.converseBedrockLambda.node.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
					],
				},
			],
			true,
		);

		// PARENT
		// PARENT | CHOICE FILTER
		this.modelChoiceCondition = sfn.Condition.stringMatches(
			"$.jobDetails.modelId",
			`${Strings.modelVendor}.${Strings.modelNamePrefix}*`,
		);
		// PARENT | TASK
		this.invokeModel = new tasks.StepFunctionsStartExecution(
			this,
			`invokeModel_${Strings.modelVendor}_${Strings.modelType}`,
			{
				stateMachine: this.sfnMain,
				resultSelector: {
					"Payload.$": "$.Output.payload",
				},
				resultPath: "$.invokeModel",
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					jobDetails: sfn.JsonPath.objectAt("$.jobDetails"),
				}),
			},
		);

		// END
	}
}
