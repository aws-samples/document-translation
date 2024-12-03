// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { aws_pipes as pipes } from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_iam as iam,
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_lambda as lambda,
	aws_appsync as appsync,
	aws_s3 as s3,
} from "aws-cdk-lib";

import * as dt_enums from "./enum";
import { dt_stepfunction } from "../../components/stepfunction";
import { dt_lambda } from "../../components/lambda";
import { dt_readableWorkflowGenerate as dt_readableWorkflowGenerate } from "./generate";

const appsyncQuery_updateJobItem = `mutation ReadableUpdateJobItem(
		$id: ID!
		$itemId: ID!
		$order: Int
		$modelId: String
		$input: String
		$output: String
		$status: String
		$type: String
		$parent: String
	) {
	readableUpdateJobItem(
		id: $id
		itemId: $itemId
		order: $order
		modelId: $modelId
		input: $input
		output: $output
		status: $status
		type: $type
		parent: $parent
	) {
		id
		itemId
		order
		modelId
		input
		output
		status
		type
		parent
	}
}`;

export interface props {
	api: appsync.GraphqlApi;
	bedrockRegion: string;
	contentBucket: s3.Bucket;
	jobTable: dynamodb.Table;
	modelTable: dynamodb.Table;
	removalPolicy: cdk.RemovalPolicy;
	updateJobItemMutation_name: string;
}

export class dt_readableWorkflow extends Construct {
	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		const workflowGenerate = new dt_readableWorkflowGenerate(
			this,
			"workflowGenerate",
			{
				bedrockRegion: props.bedrockRegion,
				contentBucket: props.contentBucket,
				removalPolicy: props.removalPolicy,
			},
		);

		//
		// STATE MACHINE
		// STATE MACHINE | TASKS
		// STATE MACHINE | TASKS | unNestJobDetails
		const unNestJobDetails = new sfn.Pass(this, "unNestJobDetails", {
			parameters: {
				dynamodb: sfn.JsonPath.objectAt("$.[0].dynamodb"),
			},
		});
		// STATE MACHINE | TASKS | unmarshallDdb
		const unmarshallDdbLambdaRole = new iam.Role(
			this,
			"unmarshallDdbLambdaRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Unmarshall DDB)",
			},
		);

		const unmarshallDdbLambda = new dt_lambda(this, "unmarshallDdbLambda", {
			role: unmarshallDdbLambdaRole,
			path: "lambda/unmarshallDdb",
			description: "Unmarshall DDB",
			bundlingNodeModules: ["@aws-sdk/util-dynamodb"],
		});

		const unmarshallDdbStream = new tasks.LambdaInvoke(
			this,
			"unmarshallDdbStream",
			{
				lambdaFunction: unmarshallDdbLambda.lambdaFunction,
				inputPath: "$.dynamodb.NewImage",
				resultSelector: {
					"jobDetails.$": "$.Payload",
				},
			},
		);

		// STATE MACHINE | TASKS | updateDbStatusToProcessing
		const updateDbLambdaRole = new iam.Role(this, "updateDbLambdaRole", {
			// ASM-L6 // ASM-L8
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			description: "Lambda Role (Update DB API)",
		});
		const iamPolicyGraphqlQuery = new iam.Policy(
			this,
			"iamPolicyGraphqlQuery",
			{
				policyName: "GraphQl-Query",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["appsync:GraphQL"],
						resources: [
							`arn:aws:appsync:${cdk.Stack.of(this).region}:${
								cdk.Stack.of(this).account
							}:apis/${props.api.apiId}/types/Mutation/fields/${
								props.updateJobItemMutation_name
							}`,
						],
					}),
				],
			},
		);
		updateDbLambdaRole?.attachInlinePolicy(iamPolicyGraphqlQuery);
		const updateDbLambda = new dt_lambda(this, "updateDbLambda", {
			role: updateDbLambdaRole,
			path: "lambda/appsyncMutationRequest",
			description: "Update DB API",
			runtime: lambda.Runtime.NODEJS_18_X,
			environment: {
				API_ENDPOINT: props.api.graphqlUrl,
				API_QUERY: appsyncQuery_updateJobItem,
				API_REGION: cdk.Stack.of(this).region,
			},
			bundlingNodeModules: ["@aws-crypto/sha256-js"],
		});

		const updateDbStatusToProcessing = new tasks.LambdaInvoke(
			this,
			"updateDbStatusToProcessing",
			{
				lambdaFunction: updateDbLambda.lambdaFunction,
				resultPath: sfn.JsonPath.DISCARD,
				payload: sfn.TaskInput.fromObject({
					id: sfn.JsonPath.objectAt("$.jobDetails.id"),
					itemId: sfn.JsonPath.objectAt("$.jobDetails.itemId"),
					status: dt_enums.ItemStatus.PROCESSING,
				}),
			},
		);

		// STATE MACHINE | TASKS | getModelParams
		const getModelParams = new tasks.DynamoGetItem(this, "getModelParams", {
			resultSelector: {
				"Payload.$": "$.Item",
			},
			resultPath: "$.modelDetails",
			table: props.modelTable,
			key: {
				id: tasks.DynamoAttributeValue.fromString(
					sfn.JsonPath.stringAt("$.jobDetails.modelId"),
				),
			},
		});

		// STATE MACHINE | TASKS | unmarshallDdb
		const unmarshallModelParams = new tasks.LambdaInvoke(
			this,
			"unmarshallModelParams",
			{
				lambdaFunction: unmarshallDdbLambda.lambdaFunction,
				resultPath: "$.modelDetails",
				payload: sfn.TaskInput.fromObject(
					sfn.JsonPath.objectAt("$.modelDetails.Payload"),
				),
				resultSelector: {
					"Payload.$": "$.Payload",
				},
			},
		);

		// STATE MACHINE | TASKS | CHOICE | ifModelParamsHasText
		const ifModelParamsHasText_choice = new sfn.Choice(
			this,
			"ifModelParamsHasText",
		);
		const ifModelParamsHasText_condition = sfn.Condition.isPresent(
			"$.modelDetails.Payload.text",
		);
		const ifModelParamsHasText_defaultSkip = new sfn.Pass(this, "skipNoText", {
			resultPath: sfn.JsonPath.DISCARD,
		});
		// STATE MACHINE | TASKS | setTextPrePrompt_modelPrePrompt
		const setTextPrePrompt_modelPrePrompt = new sfn.Pass(
			this,
			"setTextPrePrompt_modelPrePrompt",
			{
				parameters: {
					Payload: sfn.JsonPath.stringAt(
						"$.modelDetails.Payload.text.prePrompt",
					),
				},
				resultPath: "$.prePrompt",
			},
		);
		// STATE MACHINE | TASKS | startSfnGenerate
		const startSfnGenerateText = new tasks.StepFunctionsStartExecution(
			this,
			"startSfnGenerateText",
			{
				stateMachine: workflowGenerate.sfnMain,
				resultSelector: {
					"Payload.$": "$.Output.invokeModel.Payload",
				},
				resultPath: "$.startSfnGenerateText",
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					jobDetails: {
						id: sfn.JsonPath.stringAt("$.jobDetails.id"),
						itemId: sfn.JsonPath.stringAt("$.jobDetails.itemId"),
						input: sfn.JsonPath.stringAt("$.jobDetails.input"),
						identity: sfn.JsonPath.stringAt("$.jobDetails.identity"),
						modelId: sfn.JsonPath.stringAt(
							"$.modelDetails.Payload.text.modelId",
						),
						parameters: sfn.JsonPath.objectAt(
							"$.modelDetails.Payload.text.parameters",
						),
						prePrompt: sfn.JsonPath.stringAt("$.prePrompt.Payload"),
					},
				}),
			},
		);

		// STATE MACHINE | TASKS | CHOICE | ifModelParamsHasImage
		const ifModelParamsHasImage_choice = new sfn.Choice(
			this,
			"ifModelParamsHasImage",
		);
		const ifModelParamsHasImage_condition = sfn.Condition.isPresent(
			"$.modelDetails.Payload.image",
		);
		const ifModelParamsHasImage_defaultSkip = new sfn.Pass(
			this,
			"skipNoImage",
			{
				resultPath: sfn.JsonPath.DISCARD,
			},
		);

		// STATE MACHINE | TASKS | CHOICE | ifImagePrePromptGenerated
		const ifImagePrePromptGenerated_choice = new sfn.Choice(
			this,
			"ifImagePrePromptGenerated",
		);
		const ifImagePrePromptGenerated_condition = sfn.Condition.isPresent(
			"$.startSfnGenerateText.Payload",
		);
		// STATE MACHINE | TASKS | setImagePrePrompt_generatedPrePrompt
		const setImagePrePrompt_generatedPrePrompt = new sfn.Pass(
			this,
			"setImagePrePrompt_generatedPrePrompt",
			{
				parameters: {
					Payload: sfn.JsonPath.stringAt("$.startSfnGenerateText.Payload"),
				},
				resultPath: "$.prePrompt",
			},
		);
		// STATE MACHINE | TASKS | setImagePrePrompt_modelPrePrompt
		const setImagePrePrompt_modelPrePrompt = new sfn.Pass(
			this,
			"setImagePrePrompt_modelPrePrompt",
			{
				parameters: {
					Payload: sfn.JsonPath.stringAt(
						"$.modelDetails.Payload.image.prePrompt",
					),
				},
				resultPath: "$.prePrompt",
			},
		);
		// STATE MACHINE | TASKS | startSfnGenerateImage
		const startSfnGenerateImage = new tasks.StepFunctionsStartExecution(
			this,
			"startSfnGenerateImage",
			{
				stateMachine: workflowGenerate.sfnMain,
				resultSelector: {
					"Payload.$": "$.Output.invokeModel.Payload",
				},
				resultPath: "$.startSfnGenerateImage",
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					jobDetails: {
						id: sfn.JsonPath.stringAt("$.jobDetails.id"),
						itemId: sfn.JsonPath.stringAt("$.jobDetails.itemId"),
						input: sfn.JsonPath.stringAt("$.jobDetails.input"),
						identity: sfn.JsonPath.stringAt("$.jobDetails.identity"),
						modelId: sfn.JsonPath.stringAt(
							"$.modelDetails.Payload.image.modelId",
						),
						parameters: sfn.JsonPath.objectAt(
							"$.modelDetails.Payload.image.parameters",
						),
						prePrompt: sfn.JsonPath.stringAt("$.prePrompt.Payload"),
					},
				}),
			},
		);

		// STATE MACHINE | TASKS | CHOICE | setResult_generatedText
		const setResult_generatedText = new sfn.Pass(
			this,
			"setResult_generatedText",
			{
				parameters: {
					Payload: sfn.JsonPath.stringAt("$.startSfnGenerateText.Payload"),
				},
				resultPath: "$.result",
			},
		);
		// STATE MACHINE | TASKS | CHOICE | setResult_generatedImageKey
		const setResult_generatedImageKey = new sfn.Pass(
			this,
			"setResult_generatedImageKey",
			{
				parameters: {
					Payload: sfn.JsonPath.stringAt("$.startSfnGenerateImage.Payload"),
				},
				resultPath: "$.result",
			},
		);

		// STATE MACHINE | TASKS | updateDbResult
		const updateDbResult = new tasks.LambdaInvoke(this, "updateDbResult", {
			lambdaFunction: updateDbLambda.lambdaFunction,
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			resultPath: "$.updateDbResult",
			payload: sfn.TaskInput.fromObject({
				id: sfn.JsonPath.objectAt("$.jobDetails.id"),
				itemId: sfn.JsonPath.objectAt("$.jobDetails.itemId"),
				output: sfn.JsonPath.stringAt("$.result.Payload"),
				status: dt_enums.ItemStatus.COMPLETED,
			}),
		});

		// STATE MACHINE | DEF
		const sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_ReadableMain`,
			{
				nameSuffix: "ReadableMain",
				removalPolicy: props.removalPolicy,
				definition: unNestJobDetails
					.next(unmarshallDdbStream)
					.next(updateDbStatusToProcessing)
					.next(getModelParams)
					.next(unmarshallModelParams)
					.next(
						ifModelParamsHasText_choice
							.when(
								ifModelParamsHasText_condition,
								setTextPrePrompt_modelPrePrompt.next(startSfnGenerateText),
							)
							.otherwise(ifModelParamsHasText_defaultSkip)
							.afterwards()
							.next(
								ifModelParamsHasImage_choice
									.when(
										ifModelParamsHasImage_condition,
										ifImagePrePromptGenerated_choice
											.when(
												ifImagePrePromptGenerated_condition,
												setImagePrePrompt_generatedPrePrompt,
											)
											.otherwise(setImagePrePrompt_modelPrePrompt)
											.afterwards()
											.next(
												startSfnGenerateImage.next(setResult_generatedImageKey),
											),
									)
									.otherwise(
										ifModelParamsHasImage_defaultSkip.next(
											setResult_generatedText,
										),
									)
									.afterwards()
									.next(updateDbResult),
							),
					),
			},
		).StateMachine;
		NagSuppressions.addResourceSuppressions(
			sfnMain,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							updateDbLambda.lambdaFunction.node.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							unmarshallDdbLambda.lambdaFunction.node
								.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason:
						"Permission scoped to project specific resources. Execution ID unknown at deploy time.",
					appliesTo: [
						`Resource::arn:<AWS::Partition>:states:<AWS::Region>:<AWS::AccountId>:execution:{"Fn::Select":[6,{"Fn::Split":[":",{"Ref":"${cdk.Stack.of(
							this,
						).getLogicalId(
							workflowGenerate.sfnMain.node.defaultChild as cdk.CfnElement,
						)}"}]}]}*`,
					],
				},
			],

			true,
		);

		// STATE MACHINE | MAIN | DEF
		const sfnMainRename = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_ReadableMainRename`,
			{
				nameSuffix: "ReadableMainRename",
				removalPolicy: props.removalPolicy,
				definition: new tasks.StepFunctionsStartExecution(
					this,
					"startSfnMain",
					{
						stateMachine: sfnMain,
						integrationPattern: sfn.IntegrationPattern.RUN_JOB,
						name: sfn.JsonPath.format(
							"{}_{}",
							sfn.JsonPath.stringAt("$.[0].dynamodb.Keys.itemId.S"),
							sfn.JsonPath.stringAt("$.[0].eventID"),
						),
					},
				),
			},
		).StateMachine;
		// Required for "RUN_JOB"
		NagSuppressions.addResourceSuppressions(
			sfnMainRename,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
				},
			],
			true,
		);

		// PIPE | DDB JOB TO STEPFUNCTION
		if (props.jobTable.tableStreamArn) {
			// tableStreamArn may be undefined
			// PIPE | DDB JOB TO STEPFUNCTION | PERMISSIONS
			const pipeJobToSfnRole = new iam.Role(this, "pipeJobToSfnRole", {
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
				description: "Pipe Role (Pass DynamoDB job to StepFunction)",
			});
			pipeJobToSfnRole.attachInlinePolicy(
				new iam.Policy(this, "permitStartExecutionOfMain", {
					policyName: "Start-Sfn-ReadablenMain",
					statements: [
						new iam.PolicyStatement({
							// ASM-IAM
							actions: ["states:StartExecution"],
							resources: [sfnMainRename.stateMachineArn],
						}),
					],
				}),
			);
			pipeJobToSfnRole.attachInlinePolicy(
				new iam.Policy(this, "permitReadDynamoDBStream", {
					policyName: "Read-DynamoDB-Stream",
					statements: [
						new iam.PolicyStatement({
							// ASM-IAM
							actions: [
								"dynamodb:DescribeStream",
								"dynamodb:GetRecords",
								"dynamodb:GetShardIterator",
							],
							resources: [props.jobTable.tableStreamArn],
						}),
					],
				}),
			);

			// PIPE | DDB JOB TO STEPFUNCTION | PIPE
			// PIPE | DDB JOB TO STEPFUNCTION | PIPE | SOURCE
			const pipeSourceDynamoDBStreamParametersProperty: pipes.CfnPipe.PipeSourceDynamoDBStreamParametersProperty =
				{
					startingPosition: "TRIM_HORIZON",
					batchSize: 1,
				};
			const filterPattern = {
				eventName: ["INSERT", "MODIFY"],
				dynamodb: {
					NewImage: {
						status: {
							S: [
								{
									"equals-ignore-case": dt_enums.ItemStatus.GENERATE,
								},
							],
						},
					},
				},
			};
			const pipeSourceDynamoDBStreamFiltersProperty: pipes.CfnPipe.FilterCriteriaProperty =
				{
					filters: [
						{
							pattern: JSON.stringify(filterPattern),
						},
					],
				};
			const sourceParameters = {
				dynamoDbStreamParameters: pipeSourceDynamoDBStreamParametersProperty,
				filterCriteria: pipeSourceDynamoDBStreamFiltersProperty,
			};

			// PIPE | DDB JOB TO STEPFUNCTION | PIPE | TARGET
			const pipeTargetStateMachineParametersProperty: pipes.CfnPipe.PipeTargetStateMachineParametersProperty =
				{
					invocationType: "FIRE_AND_FORGET",
				};
			const targetParameters = {
				stepFunctionStateMachineParameters:
					pipeTargetStateMachineParametersProperty,
			};

			// PIPE | DDB JOB TO STEPFUNCTION | PIPE | DEF
			new pipes.CfnPipe(this, "pipeJobToSfn", {
				roleArn: pipeJobToSfnRole.roleArn,
				source: props.jobTable.tableStreamArn,
				target: sfnMainRename.stateMachineArn,
				description: "DocTran Readable Job to StepFunction",
				sourceParameters,
				targetParameters,
			});
		}

		// END
	}
}
