// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_lambda as lambda,
	aws_stepfunctions as sfn,
	aws_iam as iam,
	aws_stepfunctions_tasks as tasks,
	aws_lambda_event_sources as eventsources,
} from "aws-cdk-lib";
import { dt_lambda } from "../../components/lambda";
import { dt_stepfunction } from "../../components/stepfunction";

export interface props {
	namedStrings: { [key: string]: string };
	jobTable: dynamodb.Table;
	s3PrefixPrivate: string;
	removalPolicy: cdk.RemovalPolicy;
	sfnTranslate: sfn.StateMachine;
	sfnPii?: sfn.StateMachine;
	sfnTag?: sfn.StateMachine;
}

export class dt_translationMain extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// STATE MACHINE
		//
		// STATE MACHINE | MAIN
		// STATE MACHINE | MAIN | TASKS
		// STATE MACHINE | MAIN | TASKS | mapJobDetails - Name job variables
		const mapJobDetails = new sfn.Pass(this, "mapJobDetails", {
			parameters: {
				jobDetails: {
					jobId: sfn.JsonPath.stringAt("$.dynamodb.Keys.id.S"),
					contentType: sfn.JsonPath.stringAt(
						"$.dynamodb.NewImage.contentType.S",
					),
					languageSource: sfn.JsonPath.stringAt(
						"$.dynamodb.NewImage.languageSource.S",
					),
					languageTargets: sfn.JsonPath.objectAt(
						"$.dynamodb.NewImage.languageTargets.L",
					),
					jobIdentity: sfn.JsonPath.stringAt(
						"$.dynamodb.NewImage.jobIdentity.S",
					),
					s3PrefixToJobId: sfn.JsonPath.format(
						props.s3PrefixPrivate + "/{}/{}",
						sfn.JsonPath.stringAt("$.dynamodb.NewImage.jobIdentity.S"),
						sfn.JsonPath.stringAt("$.dynamodb.Keys.id.S"),
					),
					s3PrefixToObject: sfn.JsonPath.format(
						props.s3PrefixPrivate +
							"/{}/{}/" +
							props.namedStrings.s3StageUpload +
							"/{}",
						sfn.JsonPath.stringAt("$.dynamodb.NewImage.jobIdentity.S"),
						sfn.JsonPath.stringAt("$.dynamodb.Keys.id.S"),
						sfn.JsonPath.stringAt("$.dynamodb.NewImage.jobName.S"),
					),
				},
			},
		});
		// STATE MACHINE | MAIN | TASKS | startSfnTranslate
		const startSfnTranslate = new tasks.StepFunctionsStartExecution(
			this,
			"startSfnTranslate",
			{
				stateMachine: props.sfnTranslate,
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					jobDetails: sfn.JsonPath.objectAt("$.jobDetails"),
				}),
				name: sfn.JsonPath.stringAt("$.jobDetails.jobId"),
			},
		);
		let startSfnPii: tasks.StepFunctionsStartExecution | undefined = undefined;
		let startSfnTag: tasks.StepFunctionsStartExecution | undefined = undefined;
		if (props.sfnPii && props.sfnTag) {
			// STATE MACHINE | MAIN | TASKS | startSfnPii
			startSfnPii = new tasks.StepFunctionsStartExecution(this, "startSfnPii", {
				stateMachine: props.sfnPii,
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					jobDetails: sfn.JsonPath.objectAt("$.jobDetails"),
				}),
				name: sfn.JsonPath.stringAt("$.jobDetails.jobId"),
			});
			// STATE MACHINE | MAIN | TASKS | startSfnTag
			startSfnTag = new tasks.StepFunctionsStartExecution(this, "startSfnTag", {
				resultPath: sfn.JsonPath.DISCARD,
				stateMachine: props.sfnTag,
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					jobDetails: sfn.JsonPath.objectAt("$.jobDetails"),
					piiResult: sfn.JsonPath.objectAt("$.mainParallel[1].Output"),
				}),
				name: sfn.JsonPath.stringAt("$.jobDetails.jobId"),
			});
		}

		// STATE MACHINE | MAIN | TASKS | updateDbJobStatus
		const updateDbJobStatus = new tasks.DynamoUpdateItem(
			this,
			"updateDbJobStatus",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " + props.namedStrings.attributeForJobStatus + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString("COMPLETED"),
				},
			},
		);

		// STATE MACHINE | MAIN | DEF
		if (startSfnPii && startSfnTag) {
			this.sfnMain = new dt_stepfunction(
				this,
				`${cdk.Stack.of(this).stackName}_TranslationMain`,
				{
					nameSuffix: "TranslationMain",
					removalPolicy: props.removalPolicy,
					definition: mapJobDetails
						.next(
							// PARRLLEL CONDITIONAL
							new sfn.Parallel(this, "mainParallel", {
								resultPath: "$.mainParallel",
							})
								// P1 SfnTranslate
								.branch(startSfnTranslate)
								// P2 SfnPii
								.branch(startSfnPii),
						)
						.next(startSfnTag)
						.next(updateDbJobStatus),
				},
			).StateMachine;
		} else {
			this.sfnMain = new dt_stepfunction(
				this,
				`${cdk.Stack.of(this).stackName}_TranslationMain`,
				{
					nameSuffix: "TranslationMain",
					removalPolicy: props.removalPolicy,
					definition: mapJobDetails
						.next(
							// PARRLLEL CONDITIONAL
							new sfn.Parallel(this, "mainParallel", {
								resultPath: "$.mainParallel",
							})
								// P1 SfnTranslate
								.branch(startSfnTranslate),
						)
						.next(updateDbJobStatus),
				},
			).StateMachine;
		}

		// Required for "RUN_JOB"
		NagSuppressions.addResourceSuppressions(
			this.sfnMain,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
				},
			],
			true,
		);

		// INFRA | DYNAMODB | JOBS | STREAM LAMBDA
		const lambdaPassDynamoDBToStepFunctionRole = new iam.Role(
			this,
			"lambdaPassDynamoDBToStepFunctionRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Pass DynamoDB stream to StepFunction)",
			},
		);
		const lambdaPassDynamoDbToStepFunction = new dt_lambda(
			this,
			"lambdaPassDynamoDbToStepFunction",
			{
				role: lambdaPassDynamoDBToStepFunctionRole,
				path: "lambda/passDynamoDBToStepFunction",
				description: "Pass DynamoDB stream to StepFunction",
				runtime: lambda.Runtime.NODEJS_18_X,
				environment: {
					stateMachineArn: this.sfnMain.stateMachineArn,
				},
			},
		);
		lambdaPassDynamoDbToStepFunction.lambdaFunction.addEventSource(
			new eventsources.DynamoEventSource(props.jobTable, {
				startingPosition: lambda.StartingPosition.TRIM_HORIZON,
				retryAttempts: 3,
				filters: [
					lambda.FilterCriteria.filter({
						eventName: lambda.FilterRule.isEqual("INSERT") as lambda.FilterRule,
					}),
				],
			}),
		);
		const permitStartExecutionOfMain = new iam.Policy(
			this,
			"permitStartExecutionOfMain",
			{
				policyName: "Start-Sfn-TranslationMain",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["states:StartExecution"],
						resources: [this.sfnMain.stateMachineArn],
					}),
				],
			},
		);
		lambdaPassDynamoDBToStepFunctionRole.attachInlinePolicy(
			permitStartExecutionOfMain,
		);
		// END
	}
}
