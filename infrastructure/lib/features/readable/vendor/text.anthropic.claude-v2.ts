// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_lambda as lambda,
	aws_iam as iam,
} from "aws-cdk-lib";

import { dt_stepfunction } from "../../../components/stepfunction";
import { dt_lambda } from "../../../components/lambda";

export interface props {
	converseBedrockLambda: lambda.Function;
	removalPolicy: cdk.RemovalPolicy;
}

enum Strings {
	modelVendor = "anthropic",
	modelMatch = "claude-v2",
}

export class dt_readableWorkflow extends Construct {
	public readonly invokeModel: tasks.StepFunctionsStartExecution;
	public readonly modelChoiceCondition: sfn.Condition;
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// LAMBDA
		// LAMBDA | UTIL REGEX REPLACE
		// LAMBDA | UTIL REGEX REPLACE | ROLE
		const utilRegexReplaceLambdaRole = new iam.Role(
			this,
			"utilRegexReplaceRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Util regex replace on a string)",
			},
		);

		// LAMBDA | UTIL REGEX REPLACE | FUNCTION
		const utilRegexReplaceLambda = new dt_lambda(
			this,
			"utilRegexReplaceLambda",
			{
				role: utilRegexReplaceLambdaRole,
				path: "lambda/utilRegexReplace",
				description: "Util regex replace on a string",
			},
		);

		// LAMBDA | UTIL TRIM
		// LAMBDA | UTIL TRIM | ROLE
		const utilTrimLambdaRole = new iam.Role(this, "utilTrimRole", {
			// ASM-L6 // ASM-L8
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			description: "Lambda Role (Util regex replace on a string)",
		});

		// LAMBDA | UTIL TRIME | FUNCTION
		const utilTrimLambda = new dt_lambda(this, "utilTrimLambda", {
			role: utilTrimLambdaRole,
			path: "lambda/utilTrim",
			description: "Util regex replace on a string",
		});

		//
		// STATE MACHINE
		// STATE MACHINE | TASKS
		// STATE MACHINE | TASKS | createPrompt
		const createPrompt = new sfn.Pass(this, "createPrompt", {
			resultPath: "$.createPrompt",
			parameters: {
				prompt: sfn.JsonPath.format(
					"\n\nHuman: {}\n\n{}\n\nAssistant:",
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

		// STATE MACHINE | TASKS | utilRegexReplace
		const regexStringLeadingToColon = "^[\\w\\s]+:";
		const utilRegexReplace = new tasks.LambdaInvoke(this, "utilRegexReplace", {
			lambdaFunction: utilRegexReplaceLambda.lambdaFunction,
			resultPath: "$.utilRegexReplace",
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			payload: sfn.TaskInput.fromObject({
				string: sfn.JsonPath.stringAt(
					"$.converseBedrock.Payload.Body.completion",
				),
				pattern: regexStringLeadingToColon,
			}),
		});

		// STATE MACHINE | TASKS | utilTrim
		const utilTrim = new tasks.LambdaInvoke(this, "utilTrim", {
			lambdaFunction: utilTrimLambda.lambdaFunction,
			resultPath: "$.utilTrim",
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			payload: sfn.TaskInput.fromObject({
				string: sfn.JsonPath.stringAt("$.utilRegexReplace.Payload"),
			}),
		});

		// STATE MACHINE | TASKS | filterOutput
		const filterOutput = new sfn.Pass(this, "filterOutput", {
			parameters: {
				payload: sfn.JsonPath.stringAt("$.utilTrim.Payload"),
			},
		});

		// STATE MACHINE | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_Readable_${Strings.modelVendor}`,
			{
				nameSuffix: `Readable_${Strings.modelVendor}`,
				removalPolicy: props.removalPolicy,
				definition: createPrompt
					.next(createBody)
					.next(converseBedrock)
					.next(utilRegexReplace)
					.next(utilTrim)
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
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							utilRegexReplaceLambda.lambdaFunction.node
								.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							utilTrimLambda.lambdaFunction.node.defaultChild as cdk.CfnElement,
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
			`${Strings.modelVendor}.${Strings.modelMatch}`,
		);

		// PARENT | TASK
		this.invokeModel = new tasks.StepFunctionsStartExecution(
			this,
			`invokeModel_${Strings.modelVendor}`,
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
