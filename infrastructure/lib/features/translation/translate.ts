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

export class dt_translationTranslate extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// STATE MACHINE
		//
		// STATE MACHINE | TRANSLATE
		// STATE MACHINE | TRANSLATE | TASKS
		// STATE MACHINE | TRANSLATE | TASKS | updateDbStatusProcessing - Log to DB, jobStatus processing
		const updateDbStatusProcessing = new tasks.DynamoUpdateItem(
			this,
			"updateDbStatusProcessing",
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
					":value": tasks.DynamoAttributeValue.fromString("PROCESSING"),
				},
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | updateDbSourceKey - Log to DB, source S3 Key
		const updateDbSourceKey = new tasks.DynamoUpdateItem(
			this,
			"updateDbSourceKey",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET source" + props.namedStrings.keySuffix + " = :value",
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.s3PrefixToObject"),
					),
				},
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | listTerminologies
		const listTerminologies = new tasks.CallAwsService(
			this,
			"listTerminologies",
			{
				resultPath: "$.listTerminologies",
				service: "translate",
				action: "listTerminologies",
				parameters: {},
				iamResources: [props.contentBucket.bucketArn],
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | parseTerminologies
		const parseTerminologiesLambdaRole = new iam.Role(
			this,
			"parseTerminologiesLambdaRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Parse available Translate terminologies)",
			},
		);
		const lambdaParseTerminologies = new dt_lambda(
			this,
			"lambdaParseTerminologies",
			{
				role: parseTerminologiesLambdaRole,
				path: "lambda/parseTerminologies",
				description: "Parse available Translate terminologies",
			},
		);
		const parseTerminologies = new tasks.LambdaInvoke(
			this,
			"parseTerminologies",
			{
				lambdaFunction: lambdaParseTerminologies.lambdaFunction,
				resultPath: "$.parseTerminologies",
				resultSelector: {
					"result.$": "$.Payload",
				},
				payload: sfn.TaskInput.fromObject({
					terminologies: sfn.JsonPath.objectAt(
						"$.listTerminologies.TerminologyPropertiesList",
					),
				}),
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | isCustomTerminologyAvailable
		const isCustomTerminologyAvailable = new sfn.Pass(
			this,
			"isCustomTerminologyAvailable",
			{
				resultPath: "$.isCustomTerminologyAvailable",
				parameters: {
					"result.$":
						"States.ArrayContains($.parseTerminologies.result, $.iterationDetails.languageTarget)",
				},
			},
		);
		// STATE MACHINE | TRANSLATE | TASKS | updateDbPreTranslate - Log to DB, status, translate is pre translate job
		const updateDbPreTranslate = new tasks.DynamoUpdateItem(
			this,
			"updateDbPreTranslate",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " +
					props.namedStrings.mapForTranslateStatus +
					".#attribute = :value",
				expressionAttributeNames: {
					"#attribute": sfn.JsonPath.format(
						"{}{}",
						props.namedStrings.attributeSafePrefix,
						sfn.JsonPath.stringAt("$.iterationDetails.languageTarget"),
					),
				},
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString("Processing"),
				},
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | setCustomTerminologyTrue - Set Translate custom terminology for language
		const setCustomTerminologyTrue = new sfn.Pass(
			this,
			"setCustomTerminologyTrue",
			{
				resultPath: "$.iterationDetails.setCustomTerminology",
				parameters: {
					Payload: sfn.JsonPath.array(
						sfn.JsonPath.format(
							"{}",
							sfn.JsonPath.stringAt("$.iterationDetails.languageTarget"),
						),
					),
				},
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | setCustomTerminologyTrue - Set Translate custom terminology to none for language
		const setCustomTerminologyFalse = new sfn.Pass(
			this,
			"setCustomTerminologyFalse",
			{
				resultPath: "$.iterationDetails.setCustomTerminology",
				result: sfn.Result.fromObject({
					Payload: [],
				}),
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | createTranslationJob - Create Translate job
		const translateRole = new iam.Role(this, "translateRole", {
			assumedBy: new iam.ServicePrincipal("translate.amazonaws.com"),
			description: "Translate Role",
		});
		const translateRoleArn = translateRole.roleArn;
		const createTranslationJob = new tasks.CallAwsService(
			this,
			"createTranslationJob",
			{
				resultPath: "$.createTranslationJob",
				service: "translate",
				action: "startTextTranslationJob",
				parameters: {
					ClientToken: "documenttranslation-stepfunction",
					DataAccessRoleArn: translateRoleArn,
					"JobName.$":
						"States.Format('{}_{}', $.jobDetails.jobId, $.iterationDetails.languageTarget)",
					InputDataConfig: {
						"ContentType.$": "$.jobDetails.contentType",
						S3Uri: sfn.JsonPath.format(
							"s3://" +
							props.contentBucket.bucketName +
							"/{}/" +
							props.namedStrings.s3StageUpload,
							sfn.JsonPath.stringAt("$.jobDetails.s3PrefixToJobId"),
						),
					},
					OutputDataConfig: {
						S3Uri: sfn.JsonPath.format(
							"s3://" +
							props.contentBucket.bucketName +
							"/{}/" +
							props.namedStrings.s3StageOutput,
							sfn.JsonPath.stringAt("$.jobDetails.s3PrefixToJobId"),
						),
					},
					"SourceLanguageCode.$": "$.jobDetails.languageSource",
					"TargetLanguageCodes.$":
						"States.Array($.iterationDetails.languageTarget)",
					"TerminologyNames.$":
						"$.iterationDetails.setCustomTerminology.Payload",
				},
				iamResources: [
					`arn:aws:translate:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account
					}:*`,
				],
			},
		);
		createTranslationJob.addRetry({
			errors: ["States.ALL"],
			maxAttempts: 50,
			interval: cdk.Duration.seconds(5),
			backoffRate: 1.2,
		});

		// STATE MACHINE | TRANSLATE | TASKS | updateDbTranslateResume
		const resumeWorkflow = new dt_resumeWorkflow(this, 'resumeWorkflow', {
			pathToIdPauseTask: "$.createTranslationJob.JobId",
			removalPolicy: props.removalPolicy,
			nameSuffix: "TranslationTranslateResume",
			pathToIdWorkflow: "$.detail.jobId",
			eventPattern: {
				source: ["aws.translate"],
				detailType: ["Translate TextTranslationJob State Change"],
				detail: {
					jobStatus: ["COMPLETED"],
				},
			},
		});

		const updateDbTranslateResumeTask = resumeWorkflow.task;

		// STATE MACHINE | TRANSLATE | TASKS | updateDbTranslateResultKey - Log to DB, Translated new file S3 Key
		const updateDbTranslateResultKey = new tasks.DynamoUpdateItem(
			this,
			"updateDbTranslateResultKey",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " +
					props.namedStrings.mapForTranslateKey +
					".#attribute = :value",
				expressionAttributeNames: {
					"#attribute": sfn.JsonPath.format(
						"{}{}",
						props.namedStrings.attributeSafePrefix,
						sfn.JsonPath.stringAt("$.iterationDetails.languageTarget"),
					),
				},
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.format(
							"{}{}{}{}{}{}{}{}{}",
							`s3://${props.contentBucket.bucketName}/`,
							sfn.JsonPath.stringAt("$.jobDetails.s3PrefixToJobId"),
							`/${props.namedStrings.s3StageOutput}`,
							`/${cdk.Stack.of(this).account}-TranslateText-`,
							sfn.JsonPath.stringAt("$.createTranslationJob.JobId"),
							"/",
							sfn.JsonPath.stringAt("$.iterationDetails.languageTarget"),
							".",
							sfn.JsonPath.stringAt("$.jobDetails.jobName"),
						),
					),
				},
			},
		);

		// STATE MACHINE | TRANSLATE | TASKS | updateDbTranslateResultStatus - Log to DB, status, translate is post translate job
		const updateDbTranslateResultStatus = new tasks.DynamoUpdateItem(
			this,
			"updateDbTranslateResultStatus",
			{
				resultPath: sfn.JsonPath.DISCARD,
				table: props.jobTable,
				key: {
					id: tasks.DynamoAttributeValue.fromString(
						sfn.JsonPath.stringAt("$.jobDetails.jobId"),
					),
				},
				updateExpression:
					"SET " +
					props.namedStrings.mapForTranslateStatus +
					".#attribute = :value",
				expressionAttributeNames: {
					"#attribute": sfn.JsonPath.format(
						"{}{}",
						props.namedStrings.attributeSafePrefix,
						sfn.JsonPath.stringAt("$.iterationDetails.languageTarget"),
					),
				},
				expressionAttributeValues: {
					":value": tasks.DynamoAttributeValue.fromString("Translated"),
				},
			},
		);

		// STATE MACHINE | TRANSLATE | DEF
		// STATE MACHINE | TRANSLATE | DEF | LOOP loopLangForTranslate - Loop through target languages for translation
		const loopLangForTranslate = new sfn.Map(this, "loopLangForTranslate", {
			resultPath: "$.loopLangForTranslate",
			itemsPath: sfn.JsonPath.stringAt("$.jobDetails.languageTargets"),
			parameters: {
				"jobDetails.$": "$.jobDetails",
				iterationDetails: {
					"languageTarget.$": "$$.Map.Item.Value.S",
				},
				"parseTerminologies.$": "$.parseTerminologies",
			},
		});

		// STATE MACHINE | MAIN | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_TranslationTranslate`,
			{
				nameSuffix: "TranslationTranslate",
				removalPolicy: props.removalPolicy,
				definition: updateDbStatusProcessing
					.next(updateDbSourceKey)
					.next(listTerminologies)
					.next(parseTerminologies)
					.next(
						loopLangForTranslate.iterator(
							updateDbPreTranslate.next(isCustomTerminologyAvailable).next(
								// CHOICE - useCustomTerminologyAvailable
								new sfn.Choice(this, "useCustomTerminologyAvailable")
									.when(
										sfn.Condition.booleanEquals(
											"$.isCustomTerminologyAvailable.result",
											true,
										),
										setCustomTerminologyTrue,
									)
									.otherwise(setCustomTerminologyFalse)
									// CHOICE EXIT - useCustomTerminologyAvailable
									.afterwards()
									.next(createTranslationJob)
									.next(updateDbTranslateResumeTask)
									.next(updateDbTranslateResultKey)
									.next(updateDbTranslateResultStatus),
							),
						),
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
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
				},
			],
			true,
		);
		// ADDITIONAL PERMISSIONS | TRANSLATE
		const sfnMainRole = this.sfnMain.role;
		const permitListS3Buckets = new iam.Policy(this, "permitListS3Buckets", {
			policyName: "ListBucket-on-S3-Content-Bucket",
			statements: [
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["s3:ListBucket"],
					resources: [props.contentBucket.bucketArn],
				}),
			],
		});
		translateRole?.attachInlinePolicy(permitListS3Buckets);

		const policyPermitWriteToS3 = new iam.Policy(this, "permitWriteToS3", {
			policyName: "PubObject-into-S3-Content-Bucket",
			statements: [
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["s3:PutObject"],
					resources: [props.contentBucket.bucketArn + "/*"],
				}),
			],
		});
		translateRole?.attachInlinePolicy(policyPermitWriteToS3);
		NagSuppressions.addResourceSuppressions(
			policyPermitWriteToS3,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
				},
			],
			true,
		);

		const policyPermitReadS3 = new iam.Policy(this, "permitReadS3", {
			policyName: "GetObject-in-S3-Content-Bucket",
			statements: [
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["s3:GetObject"],
					resources: [props.contentBucket.bucketArn + "/*"],
				}),
			],
		});
		translateRole?.attachInlinePolicy(policyPermitReadS3);
		NagSuppressions.addResourceSuppressions(
			policyPermitReadS3,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
				},
			],
			true,
		);

		const policyPermitListTerminologies = new iam.Policy(
			this,
			"permitListTerminologies",
			{
				policyName: "List-translate-terminologies",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["translate:ListTerminologies"],
						resources: ["*"],
					}),
				],
			},
		);
		sfnMainRole?.attachInlinePolicy(policyPermitListTerminologies);
		NagSuppressions.addResourceSuppressions(
			policyPermitListTerminologies,
			[
				{
					id: "AwsSolutions-IAM5",
					reason:
						"All resources have been selected for you because this service does not allow you to choose specific resources.",
					appliesTo: ["Action::translate:ListTerminologies", "Resource::*"],
				},
			],
			true,
		);

		const policyPermitStartTranslationJob = new iam.Policy(
			this,
			"permitStartTranslationJob",
			{
				policyName: "Start-text-translation-job",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["translate:StartTextTranslationJob"],
						resources: ["*"],
					}),
				],
			},
		);
		sfnMainRole?.attachInlinePolicy(policyPermitStartTranslationJob);
		NagSuppressions.addResourceSuppressions(
			policyPermitStartTranslationJob,
			[
				{
					id: "AwsSolutions-IAM5",
					reason:
						"All resources have been selected for you because this service does not allow you to choose specific resources.",
					appliesTo: [
						"Action::translate:StartTextTranslationJob",
						"Resource::*",
					],
				},
			],
			true,
		);

		const policyPermitPassTranslateRole = new iam.Policy(
			this,
			"permitPassTranslateRole",
			{
				policyName: "PassRole-translateRole",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["iam:PassRole"],
						resources: [translateRole.roleArn],
					}),
				],
			},
		);
		sfnMainRole?.attachInlinePolicy(policyPermitPassTranslateRole);

		// END
	}
}
