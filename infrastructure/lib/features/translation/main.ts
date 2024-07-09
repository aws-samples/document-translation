// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { aws_pipes as pipes } from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_stepfunctions as sfn,
	aws_iam as iam,
	aws_stepfunctions_tasks as tasks,
} from "aws-cdk-lib";
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
		// STATE MACHINE | MAIN | TASKS | unNestJobDetails
		const unNestJobDetails = new sfn.Pass(this, "unNestJobDetails", {
			parameters: {
				dynamodb: sfn.JsonPath.objectAt("$.[0].dynamodb"),
			},
		});
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
					jobName: sfn.JsonPath.stringAt("$.dynamodb.NewImage.jobName.S"),
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
					definition: unNestJobDetails
						.next(mapJobDetails)
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
					definition: unNestJobDetails
						.next(mapJobDetails)
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

		// STATE MACHINE | MAIN | DEF
		const sfnMainRename = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationMainRename`,
			{
				nameSuffix: "TranslationMainRename",
				removalPolicy: props.removalPolicy,
				definition: new tasks.StepFunctionsStartExecution(
					this,
					"startSfnMain",
					{
						stateMachine: this.sfnMain,
						integrationPattern: sfn.IntegrationPattern.RUN_JOB,
						name: sfn.JsonPath.format(
							"{}_{}",
							sfn.JsonPath.stringAt("$.[0].dynamodb.Keys.id.S"),
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
					policyName: "Start-Sfn-TranslationMain",
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
				eventName: ["INSERT"],
				dynamodb: {
					NewImage: {
						jobStatus: {
							S: [
								{
									"equals-ignore-case": "UPLOADED",
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
				description: "DocTran Translation Job to StepFunction",
				sourceParameters,
				targetParameters,
			});
		}

		// END
	}
}
