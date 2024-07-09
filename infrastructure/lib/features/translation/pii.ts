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
	aws_cloudfront as cloudfront,
	aws_logs as logs,
	aws_logs_destinations as destinations,
} from "aws-cdk-lib";
import { dt_lambda } from "../../components/lambda";
import { dt_resumeWorkflow } from "../../components/sfnResume";
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

		// STATE MACHINE | MAIN | TASKS | updateDbPiiResume
		const resumeWorkflow = new dt_resumeWorkflow(this, "resumeWorkflow", {
			pathToIdPauseTask: "$.createClassificationJob.JobId",
			removalPolicy: props.removalPolicy,
			nameSuffix: "TranslationPiiResume",
			pathToIdWorkflow: "$.detail.jobId",
			eventPattern: {
				source: ["doctran.macie"],
				detailType: ["JOB_COMPLETED"],
				detail: {
					eventType: ["JOB_COMPLETED"],
				},
			},
		});
		const updateDbPiiResume = resumeWorkflow.task;

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
					.next(updateDbPiiResume)
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

		// MACIE CLOUDWATCH LOG | LAMBDA PassMacieLogToEventBridgeRole - Map Macie result to job
		const lambdaPassMacieLogToEventBridgeRole = new iam.Role(
			this,
			"lambdaPassMacieLogToEventBridgeRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Pass Macie log to EventBridge)",
			},
		);

		const lambdaPassMacieLogToEventBridge = new dt_lambda(
			this,
			"lambdaPassMacieLogToEventBridge",
			{
				role: lambdaPassMacieLogToEventBridgeRole,
				path: "lambda/passLogToEventBridge",
				description: "Pass Macie log to EventBridge",
				environment: {
					eventSource: "macie",
					pathToDetailType: "eventType",
				},
			},
		).lambdaFunction;

		const permitPutEventsIntoDefaultBus = new iam.Policy(
			this,
			"permitPutEventsIntoDefaultBus",
			{
				policyName: "permitPutEventsIntoDefaultBus",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["events:PutEvents"],
						resources: [
							`arn:aws:events:${cdk.Stack.of(this).region}:${
								cdk.Stack.of(this).account
							}:event-bus/default`,
						],
					}),
				],
			},
		);
		lambdaPassMacieLogToEventBridgeRole?.attachInlinePolicy(
			permitPutEventsIntoDefaultBus,
		);

		new logs.SubscriptionFilter(this, "macieLogSubscription", {
			logGroup: logs.LogGroup.fromLogGroupName(
				this,
				"macieClassificationJobs",
				"/aws/macie/classificationjobs",
			),
			destination: new destinations.LambdaDestination(
				lambdaPassMacieLogToEventBridge,
			),
			filterPattern: logs.FilterPattern.stringValue(
				"$.eventType",
				"=",
				"JOB_COMPLETED",
			),
		});

		// END
	}
}
