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
	aws_iam as iam,
	aws_macie as macie,
	aws_events as events,
	aws_cloudfront as cloudfront,
	aws_logs as logs,
	aws_logs_destinations as destinations,
} from "aws-cdk-lib";
import { dt_lambda } from "../../components/lambda";
import { dt_callback } from "../../components/callback";
import { dt_stepfunction } from "../../components/stepfunction";

export interface props {
	namedStrings: { [key: string]: string };
	contentBucket: s3.Bucket;
	jobTable: dynamodb.Table;
	removalPolicy: cdk.RemovalPolicy;
	s3PrefixPrivate: string;
}

export class dt_translationPii extends Construct {
	public readonly websiteDistribution: cloudfront.Distribution;
	public readonly contentBucket: s3.Bucket;
	public readonly jobTable: dynamodb.Table;
	public readonly helpTable: dynamodb.Table;
	public readonly sfnMain: sfn.StateMachine;
	public readonly sfnCallback: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// INFRA | MACIE
		const macieCustomDataIdentifier = new macie.CfnCustomDataIdentifier(
			this,
			"macieCustomDataIdentifier",
			{
				name: "customerReference",
				description: 'Unique ID used to identify individuals. Eg "CR12345678".',
				regex: "CR(\\d){8}",
			},
		);

		// STATE MACHINE
		// STATE MACHINE | MAIN
		// STATE MACHINE | MAIN | TASKS
		// STATE MACHINE | MAIN | TASKS | updateDbPrePiiDetect - Log to DB, status, pii is pre detection job
		const updateDbPrePiiDetect = new tasks.DynamoUpdateItem(
			this,
			"updateDbPrePiiDetect",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " + props.namedStrings.attributeForPiiStatus + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString("pre"),
				},
			},
		);

		// STATE MACHINE | MAIN | TASKS | createClassificationJob - Create Macie classificaiton job
		const createClassificationJob = new tasks.CallAwsService(
			this,
			"createClassificationJob",
			{
				resultPath: "$.createClassificationJob",
				service: "Macie2",
				action: "createClassificationJob",
				parameters: {
					ClientToken: "documenttranslation-stepfunction",
					JobType: "ONE_TIME",
					Name: sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					CustomDataIdentifierIds: [macieCustomDataIdentifier.attrId],
					ManagedDataIdentifierSelector: "ALL",
					S3JobDefinition: {
						BucketDefinitions: [
							{
								AccountId: cdk.Stack.of(this).account,
								Buckets: [props.contentBucket.bucketName],
							},
						],
						Scoping: {
							Includes: {
								And: [
									{
										SimpleScopeTerm: {
											Key: "OBJECT_KEY",
											Comparator: "STARTS_WITH",
											Values: sfn.JsonPath.array(
												sfn.JsonPath.format(
													"{}/" + props.namedStrings.s3StageUpload,
													sfn.JsonPath.stringAt("$.jobDetails.s3PrefixToJobId"),
												),
											),
										},
									},
								],
							},
						},
					},
				},
				iamResources: [
					`arn:aws:macie2:${cdk.Stack.of(this).region}:${
						cdk.Stack.of(this).account
					}:classification-job/*`,
				],
			},
		);
		createClassificationJob.addRetry({
			errors: ["States.ALL"],
			maxAttempts: 50,
			interval: cdk.Duration.seconds(5),
			backoffRate: 1.1,
		});

		// STATE MACHINE | MAIN | TASKS | updateDbPiiDetectCallback - Log to DB, PIIDetect callback token
		// SDK task required for TaskToken with DynamoDB
		const updateDbPiiDetectCallback = new tasks.CallAwsService(
			this,
			"updateDbPiiDetectCallback",
			{
				resultPath: sfn.JsonPath.DISCARD,
				service: "dynamodb",
				action: "updateItem",
				integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
				parameters: {
					TableName: props.jobTable.tableName,
					Key: {
						id: {
							S: sfn.JsonPath.stringAt("$.jobDetails.jobId"),
						},
					},
					UpdateExpression:
						"SET " + props.namedStrings.attributeForPiiCallback + " = :value",
					ExpressionAttributeValues: {
						":value": {
							S: sfn.JsonPath.taskToken,
						},
					},
				},
				iamResources: [props.jobTable.tableArn],
			},
		);

		// STATE MACHINE | MAIN | TASKS | listMacieFindings - Get Macie findings from results
		const listMacieFindings = new tasks.CallAwsService(
			this,
			"listMacieFindings",
			{
				resultPath: "$.listMacieFindings",
				service: "macie2",
				action: "listFindings",
				parameters: {
					FindingCriteria: {
						Criterion: {
							"classificationDetails.jobId": {
								Eq: sfn.JsonPath.array(
									sfn.JsonPath.stringAt("$.createClassificationJob.JobId"),
								),
							},
						},
					},
				},
				iamResources: [
					`arn:aws:macie2:${cdk.Stack.of(this).region}:${
						cdk.Stack.of(this).account
					}:*`,
				],
			},
		);

		// STATE MACHINE | MAIN | TASKS | updateDbPostPiiDetect - Log to DB, status, pii is post detection job
		const updateDbPostPiiDetect = new tasks.DynamoUpdateItem(
			this,
			"updateDbPostPiiDetect",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " + props.namedStrings.attributeForPiiStatus + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString("post"),
				},
			},
		);

		// STATE MACHINE | MAIN | TASKS | updateDbPiiDetectTrue - Log to DB, status, PII detect true
		const updateDbPiiDetectTrue = new tasks.DynamoUpdateItem(
			this,
			"updateDbPiiDetectTrue",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " + props.namedStrings.attributeForPiiStatus + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString(
						props.namedStrings.tagPiiValueTrue,
					),
				},
			},
		);

		// STATE MACHINE | MAIN | TASKS | piiResultIsTrue
		const piiResultIsTrue = new sfn.Pass(this, "piiResultIsTrue", {
			result: sfn.Result.fromString(props.namedStrings.tagPiiValueTrue),
		});

		// STATE MACHINE | MAIN | TASKS | updateDbPiiDetectTrue - Log to DB, status, PII detect false
		const updateDbPiiDetectFalse = new tasks.DynamoUpdateItem(
			this,
			"updateDbPiiDetectFalse",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " + props.namedStrings.attributeForPiiStatus + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString(
						props.namedStrings.tagPiiValueFalse,
					),
				},
			},
		);

		// STATE MACHINE | MAIN | TASKS | piiResultIsFalse
		const piiResultIsFalse = new sfn.Pass(this, "piiResultIsFalse", {
			result: sfn.Result.fromString(props.namedStrings.tagPiiValueFalse),
		});

		// STATE MACHINE | MAIN | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationPii`,
			{
				nameSuffix: "TranslationPii",
				removalPolicy: props.removalPolicy,
				definition: updateDbPrePiiDetect
					.next(createClassificationJob)
					.next(updateDbPiiDetectCallback)
					.next(listMacieFindings)
					.next(updateDbPostPiiDetect)
					.next(
						// CHOICE - wasPIIDetected
						new sfn.Choice(this, "wasPIIDetected")
							.when(
								sfn.Condition.isNotPresent(
									"$.parallelTranslateAndMacie[0].listMacieFindings.FindingIds[0]",
								),
								updateDbPiiDetectFalse.next(piiResultIsFalse),
							)
							.otherwise(updateDbPiiDetectTrue.next(piiResultIsTrue)),
					),
			},
		).StateMachine;
		NagSuppressions.addResourceSuppressions(
			this.sfnMain,
			[
				{
					id: "AwsSolutions-IAM5",
					reason:
						"Dynamic classification job id unknown at build time. Allow wildcard within account.",
					appliesTo: [
						"Resource::arn:aws:macie2:<AWS::Region>:<AWS::AccountId>:classification-job/*",
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason:
						"Dynamic finding ids unknown at build time. Allow wildcard within account.",
					appliesTo: [
						"Resource::arn:aws:macie2:<AWS::Region>:<AWS::AccountId>:*",
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason:
						"Dynamic translation job id unknown at build time. Allow wildcard within account.",
					appliesTo: [
						"Resource::arn:aws:translate:<AWS::Region>:<AWS::AccountId>:*",
					],
				},
			],
			true,
		);

		const sfnMainArn = this.sfnMain.stateMachineArn;

		// STATE MACHINE | CALLBACKSEND
		this.sfnCallback = new dt_callback(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationPiiCallback`,
			{
				nameSuffix: "TranslationPiiCallback",
				jobTable: props.jobTable,
				removalPolicy: props.removalPolicy,
				dbCallbackParameters: {
					TableName: props.jobTable.tableName,
					Key: {
						id: {
							S: sfn.JsonPath.stringAt("$.jobId"),
						},
					},
					ProjectionExpression: sfn.JsonPath.stringAt("$.callbackAttribute"),
				},
			},
		).sfnMain;

		new events.Rule(this, "onSfnExecutionStateNotSuccess", {
			eventPattern: {
				source: ["aws.states"],
				detail: {
					status: ["FAILED", "TIMED_OUT", "ABORTED"],
					stateMachineArn: [sfnMainArn, this.sfnCallback.stateMachineArn],
				},
			},
		});
		// STATE MACHINE | CALLBACKSEND | DEP | LAMBDA parseMacieResult - Map Macie result to job
		const lambdaParseMacieResultRole = new iam.Role(
			this,
			"lambdaParseMacieResultRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Parse Macie result)",
			},
		);

		const lambdaParseMacieResult = new dt_lambda(this, "parseMacieResult", {
			role: lambdaParseMacieResultRole,
			path: "lambda/parseMacieResult",
			description: "Parse Macie result",
			environment: {
				stateMachineArn: this.sfnCallback.stateMachineArn,
				attributeForPiiCallback: props.namedStrings.attributeForPiiCallback,
			},
		}).lambdaFunction;

		const permitStartCallbackPii = new iam.Policy(
			this,
			"permitStartCallbackPii",
			{
				policyName: "Start-Sfn-TranslationPiiCallback",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["states:StartExecution"],
						resources: [this.sfnCallback.stateMachineArn],
					}),
				],
			},
		);
		lambdaParseMacieResultRole?.attachInlinePolicy(permitStartCallbackPii);

		new logs.SubscriptionFilter(this, "macieLogSubscription", {
			logGroup: logs.LogGroup.fromLogGroupName(
				this,
				"macieClassificationJobs",
				"/aws/macie/classificationjobs",
			),
			destination: new destinations.LambdaDestination(lambdaParseMacieResult),
			filterPattern: logs.FilterPattern.stringValue(
				"$.eventType",
				"=",
				"JOB_COMPLETED",
			),
		});

		// END
	}
}
