// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_s3 as s3,
	aws_iam as iam,
	aws_stepfunctions as sfn,
} from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import * as identitypool from "@aws-cdk/aws-cognito-identitypool-alpha";
import { dt_translationPii } from "../features/dt_translationPii";
import { dt_translationTag } from "../features/dt_translationTag";
import { dt_translationTranslate } from "../features/dt_translationTranslate";
import { dt_translationErrors } from "../features/dt_translationErrors";
import { dt_translationLifecycle } from "../features/dt_translationLifecycle";
import { dt_translationMain } from "../features/dt_translationMain";

const namedStrings: { [key: string]: string } = {
	attributeForJobStatus: "jobStatus",
	attributeForPiiCallback: "piiCallback",
	attributeForPiiStatus: "piiStatus",
	attributeSafePrefix: "lang",
	keySuffix: "Key",
	mapForTranslateCallback: "translateCallback",
	mapForTranslateKey: "translateKey",
	mapForTranslateStatus: "translateStatus",
	s3StageOutput: "output",
	s3StageUpload: "upload",
	s3StageExpired: "expired",
	tagPii: "PII",
	tagPiiValueFalse: "False",
	tagPiiValueTrue: "True",
};

export interface props {
	serverAccessLoggingBucket: s3.Bucket;
	contentLifecycleDefault: number;
	contentLifecyclePii: number;
	s3PrefixPrivate: string;
	identityPool: identitypool.IdentityPool;
	api: appsync.GraphqlApi;
	translationPii: boolean;
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_translate extends Construct {
	public readonly contentBucket: s3.Bucket;
	public readonly jobTable: dynamodb.Table;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// INFRA
		//
		// INFRA | S3 | CONTENT
		this.contentBucket = new s3.Bucket(this, "contentBucket", {
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // ASM-S2
			encryption: s3.BucketEncryption.S3_MANAGED, // ASM-S3
			enforceSSL: true, // ASM-S10
			versioned: true,
			serverAccessLogsBucket: props.serverAccessLoggingBucket, // ASM-S1
			serverAccessLogsPrefix: "content-bucket/", // ASM-S1
			removalPolicy: props.removalPolicy, // ASM-CFN1
			cors: [
				{
					allowedMethods: [s3.HttpMethods.PUT],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"],
				},
			],
		});
		// INFRA | S3 | CONTENT | LIFECYCLE RULES
		// INFRA | S3 | CONTENT | LIFECYCLE RULES | DEFAULT
		this.contentBucket.addLifecycleRule({
			id: "default",
			enabled: true,
			expiration: cdk.Duration.days(props.contentLifecycleDefault),
			noncurrentVersionExpiration: cdk.Duration.days(
				props.contentLifecycleDefault
			),
			abortIncompleteMultipartUploadAfter: cdk.Duration.days(
				props.contentLifecycleDefault
			),
		});
		// INFRA | S3 | API ROLE PERMISSION
		const policyAuthenticatedPermitScopedS3 = new iam.Policy(
			this,
			"policyAuthenticatedPermitScopedS3",
			{
				policyName: "Get-and-Put-Objects-in-Cognito-scoped-Content-Bucket-keys",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM // ASM-COG7
						actions: ["s3:PutObject", "s3:GetObject"],
						resources: [
							`${this.contentBucket.bucketArn}/${props.s3PrefixPrivate}/\${cognito-identity.amazonaws.com:sub}/*`,
						],
					}),
				],
			}
		);
		props.identityPool.authenticatedRole.attachInlinePolicy(
			policyAuthenticatedPermitScopedS3
		);
		NagSuppressions.addResourceSuppressions(
			policyAuthenticatedPermitScopedS3,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Scoped to Cognito identity. Unknown file names uploaded",
					appliesTo: [
						"Action::s3:PutObject",
						"Action::s3:GetObject",
						"Resource::<basetranslatecontentBucketD9522F8D.Arn>/private/<cognito-identity.amazonaws.com:sub>/*",
					],
				},
			],
			true
		);

		// INFRA | DYNAMODB
		// INFRA | DYNAMODB | JOBS
		this.jobTable = new dynamodb.Table(this, "jobTable", {
			partitionKey: {
				name: "id",
				type: dynamodb.AttributeType.STRING,
			},
			stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
			pointInTimeRecovery: true, // ASM-DDB3
			removalPolicy: props.removalPolicy, // ASM-CFN1
		});

		// INFRA | DYNAMODB | JOBS | API
		// INFRA | DYNAMODB | JOBS | API | DATA SOURCE
		const apiDsJobTable = props.api.addDynamoDbDataSource(
			"apiDsJobTable",
			this.jobTable
		);

		// INFRA | DYNAMODB | JOBS | API | QUERY
		const jobNodeDefinition = {
			contentType: appsync.GraphqlType.string({ isRequired: true }),
			createdAt: appsync.GraphqlType.awsTimestamp(),
			id: appsync.GraphqlType.id({ isRequired: true }),
			jobIdentity: appsync.GraphqlType.string({ isRequired: true }),
			jobName: appsync.GraphqlType.string({ isRequired: true }),
			jobOwner: appsync.GraphqlType.string(),
			jobStatus: appsync.GraphqlType.string(),
			languageSource: appsync.GraphqlType.string({ isRequired: true }),
			languageTargets: appsync.GraphqlType.awsJson(),
			sourceKey: appsync.GraphqlType.string(),
			sourceStatus: appsync.GraphqlType.string(),
			translateCallback: appsync.GraphqlType.awsJson(),
			translateKey: appsync.GraphqlType.awsJson(),
			translateStatus: appsync.GraphqlType.awsJson(),
		};

		const jobNode = new appsync.ObjectType("jobNode", {
			definition: jobNodeDefinition,
		});

		const jobNodeConnection = new appsync.ObjectType(`jobNodeConnection`, {
			definition: {
				items: jobNode.attribute({ isList: true, isRequired: true }),
				nextToken: appsync.GraphqlType.string(),
			},
		});

		const listJobsQuery = new appsync.ResolvableField({
			returnType: jobNodeConnection.attribute(),
			args: {
				limit: appsync.GraphqlType.int(),
				nextToken: appsync.GraphqlType.string(),
			},
			dataSource: apiDsJobTable,
			requestMappingTemplate: appsync.MappingTemplate.fromFile(
				"./appsync/query-listJobs-request.vtl"
			),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
		});

		props.api.addType(jobNode);
		props.api.addType(jobNodeConnection);
		props.api.addQuery("listJobs", listJobsQuery);

		// INFRA | DYNAMODB | JOBS | API | MUTATION
		const jobNodeInput = new appsync.InputType("jobNodeInput", {
			definition: jobNodeDefinition,
		});

		const createJobMutation = new appsync.ResolvableField({
			returnType: jobNodeConnection.attribute(),
			args: {
				limit: appsync.GraphqlType.int(),
				nextToken: appsync.GraphqlType.string(),
				input: jobNodeInput.attribute(),
			},
			dataSource: apiDsJobTable,
			requestMappingTemplate: appsync.MappingTemplate.fromFile(
				"./appsync/mutation-createJob-request.vtl"
			),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
		});

		props.api.addType(jobNodeInput);
		props.api.addMutation("createJob", createJobMutation);

		// INFRA | DYNAMODB | HELP
		const helpTable = new dynamodb.Table(this, "helpTable", {
			partitionKey: {
				name: "id",
				type: dynamodb.AttributeType.STRING,
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
			pointInTimeRecovery: true, // ASM-DDB3
			removalPolicy: props.removalPolicy, // ASM-CFN1
		});

		// INFRA | DYNAMODB | HELP | API | DATA SOURCE
		const apiDsHelpTable = props.api.addDynamoDbDataSource(
			"apiDsHelpTable",
			helpTable
		);

		// INFRA | DYNAMODB | JOBS | API | QUERY
		const helpNode = new appsync.ObjectType("helpNode", {
			definition: {
				description: appsync.GraphqlType.string(),
				id: appsync.GraphqlType.id({ isRequired: true }),
				link: appsync.GraphqlType.string(),
				order: appsync.GraphqlType.int(),
				title: appsync.GraphqlType.string(),
			},
		});

		const helpNodeConnection = new appsync.ObjectType(`helpNodeConnection`, {
			definition: {
				items: helpNode.attribute({ isList: true, isRequired: true }),
				nextToken: appsync.GraphqlType.string(),
			},
		});

		const listHelpsQuery = new appsync.ResolvableField({
			returnType: helpNodeConnection.attribute(),
			args: {
				limit: appsync.GraphqlType.int(),
				nextToken: appsync.GraphqlType.string(),
			},
			dataSource: apiDsHelpTable,
			requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
		});

		props.api.addType(helpNode);
		props.api.addType(helpNodeConnection);
		props.api.addQuery("listHelps", listHelpsQuery);

		//
		// STATE MACHINE
		//
		// stepFunctionArns
		const handleErrorsFromSfnArns: string[] = [];
		// STATE MACHINE | TRANSLATE
		const featTranslationTranslate = new dt_translationTranslate(
			this,
			"featTranslationTranslate",
			{
				namedStrings,
				contentBucket: this.contentBucket,
				jobTable: this.jobTable,
				removalPolicy: props.removalPolicy,
				s3PrefixPrivate: props.s3PrefixPrivate,
			}
		);
		handleErrorsFromSfnArns.push(
			featTranslationTranslate.sfnCallback.stateMachineArn
		);

		let sfnPii: undefined | sfn.StateMachine = undefined;
		let sfnTag: undefined | sfn.StateMachine = undefined;
		if (props.translationPii) {
			// INFRA | S3 | CONTENT | LIFECYCLE RULES | PII
			this.contentBucket.addLifecycleRule({
				id: "pii",
				enabled: true,
				expiration: cdk.Duration.days(props.contentLifecyclePii),
				noncurrentVersionExpiration: cdk.Duration.days(
					props.contentLifecyclePii
				),
				abortIncompleteMultipartUploadAfter: cdk.Duration.days(
					props.contentLifecyclePii
				),
			});
			// STATE MACHINE | PII
			const featTranslationPii = new dt_translationPii(
				this,
				"featTranslationPii",
				{
					namedStrings,
					contentBucket: this.contentBucket,
					jobTable: this.jobTable,
					removalPolicy: props.removalPolicy, // ASM-CFN1
					s3PrefixPrivate: props.s3PrefixPrivate,
				}
			);
			handleErrorsFromSfnArns.push(
				featTranslationPii.sfnCallback.stateMachineArn
			);
			sfnPii = featTranslationPii.sfnMain;

			// STATE MACHINE | PII
			const featTranslationTag = new dt_translationTag(
				this,
				"featTranslationTag",
				{
					namedStrings,
					contentBucket: this.contentBucket,
					removalPolicy: props.removalPolicy, // ASM-CFN1
				}
			);
			sfnTag = featTranslationTag.sfnMain;
		}

		// STATE MACHINE | MAIN
		const featTranslationMain = new dt_translationMain(
			this,
			"featTranslationMain",
			{
				namedStrings,
				jobTable: this.jobTable,
				s3PrefixPrivate: props.s3PrefixPrivate,
				removalPolicy: props.removalPolicy, // ASM-CFN1
				sfnTranslate: featTranslationTranslate.sfnMain,
				sfnPii,
				sfnTag,
			}
		);
		handleErrorsFromSfnArns.push(featTranslationMain.sfnMain.stateMachineArn);

		// STATE MACHINE | ERRORS
		new dt_translationErrors(this, "featTranslationErrors", {
			namedStrings,
			s3PrefixPrivate: props.s3PrefixPrivate,
			removalPolicy: props.removalPolicy, // ASM-CFN1
			stepFunctionArns: handleErrorsFromSfnArns,
			sfnCallback: featTranslationTranslate.sfnCallback,
			contentBucket: this.contentBucket,
			jobTable: this.jobTable,
		});

		// STATE MACHINE | LIFECYCLE
		new dt_translationLifecycle(this, "featTranslationLifecycle", {
			namedStrings,
			removalPolicy: props.removalPolicy, // ASM-CFN1
			contentBucket: this.contentBucket,
			jobTable: this.jobTable,
		});

		// END
	}
}
