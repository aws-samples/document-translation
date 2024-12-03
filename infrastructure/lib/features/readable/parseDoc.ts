// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_iam as iam,
	aws_stepfunctions as sfn,
	aws_s3 as s3,
	aws_stepfunctions_tasks as tasks,
	aws_lambda as lambda,
	aws_appsync as appsync,
} from "aws-cdk-lib";

// import * as dt_enums from "./enum";
import { dt_stepfunction } from "../../components/stepfunction";
import { dt_lambda } from "../../components/lambda";

const appsyncQuery_createJobItem = `mutation ReadableCreateJobItem(
	$id: ID!
	$identity: String!
	$order: Int!
	$modelId: String
	$input: String
	$output: String
	$owner: String
	$status: String
	$type: String!
	$parent: String
) {
readableCreateJobItem(
	id: $id
	identity: $identity
	order: $order
	modelId: $modelId
	input: $input
	output: $output
	owner: $owner
	status: $status
	type: $type
	parent: $parent
) {
	id
	identity
	itemId
	order
	modelId
	input
	output
	owner
	status
	type
	parent
}
}`;

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
	contentBucket: s3.Bucket;
	removalPolicy: cdk.RemovalPolicy;
	api: appsync.GraphqlApi;
	createJobItemMutation_name: string;
	updateJobItemMutation_name: string;
}

export class dt_readableWorkflowParseDoc extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// LAMBDA
		// LAMBDA | DOC TO HTML
		// LAMBDA | DOC TO HTML | ROLE
		const permitBucket = new iam.Policy(
			this,
			"permitBucket",
			{
				policyName: "Permit-read-write-to-bucket-for-doc-parsing",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["s3:getObject", "s3:putObject"],
						resources: [
							`${props.contentBucket.bucketArn}/*`, 
						],
					}),
				],
			},
		);
		NagSuppressions.addResourceSuppressions(
			permitBucket,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources.",
					appliesTo: [
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							props.contentBucket.node.defaultChild as cdk.CfnElement,
						)}.Arn>/*`,
					],
				},
			],
			true,
		);

		// LAMBDA | DOC TO HTML | FUNCTION
		const docToHtmlLambda = new dt_lambda(this, "docToHtmlLambda", {
			path: "lambda/docToHtml",
			description: "Parse Doc to HTML",
			environment: {
				BUCKET_NAME: props.contentBucket.bucketName
			},
			timeout: cdk.Duration.minutes(1),
		});
		docToHtmlLambda.lambdaRole.attachInlinePolicy(permitBucket)

		// STATE MACHINE | TASKS | DOC TO HTML
		const docToHtml = new tasks.LambdaInvoke(this, "docToHtml", {
			lambdaFunction: docToHtmlLambda.lambdaFunction,
			resultPath: "$.Content",
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			payload: sfn.TaskInput.fromObject({
				key: sfn.JsonPath.objectAt("$.jobDetails.key"),
			}),
		});

		// LAMBDA
		// LAMBDA | HTML TO MD
		// LAMBDA | HTML TO MD | FUNCTION
		const htmlToMdLambda = new dt_lambda(this, "htmlToMdLambda", {
			path: "lambda/htmlToMd",
			description: "Parse HTML to MD",
			environment: {
				BUCKET_NAME: props.contentBucket.bucketName
			},
			timeout: cdk.Duration.minutes(1),	
		});

		// STATE MACHINE | TASKS | htmlToMd
		const htmlToMd = new tasks.LambdaInvoke(this, "htmlToMd", {
			lambdaFunction: htmlToMdLambda.lambdaFunction,
			resultPath: "$.Content",
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			payload: sfn.TaskInput.fromObject({
				html: sfn.JsonPath.objectAt("$.Content.Payload"),
			}),
		});

		// 
		// LAMBDA
		// LAMBDA | Split MD
		// LAMBDA | Split MD | FUNCTION
		const splitMdLambda = new dt_lambda(this, "splitMdLambda", {
			path: "lambda/utilSplit",
			description: "Split MD",
			environment: {
				BUCKET_NAME: props.contentBucket.bucketName
			},
			timeout: cdk.Duration.minutes(1),	
		});

		// STATE MACHINE | TASKS | splitMd
		const splitMd = new tasks.LambdaInvoke(this, "splitMd", {
			lambdaFunction: splitMdLambda.lambdaFunction,
			resultPath: "$.Content",
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			payload: sfn.TaskInput.fromObject({
				string: sfn.JsonPath.objectAt("$.Content.Payload"),
				splitter: "\n\n",
			}),
		});

		// MAP
		const iterateMd = new sfn.Map(this, "iterateMd", {
			itemsPath: sfn.JsonPath.stringAt("$.Content.Payload"),
			maxConcurrency: 5,
			parameters: {
				jobDetails: sfn.JsonPath.objectAt("$.jobDetails"),
				value: sfn.JsonPath.objectAt("$$.Map.Item.Value"),
				index: sfn.JsonPath.objectAt("$$.Map.Item.Index"),
			},
		});

		// STATE MACHINE | TASKS | createJobItem
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
								props.createJobItemMutation_name
							}`,
						],
					}),
				],
			},
		);
		const updateDbLambda = new dt_lambda(this, "updateDbLambda", {
			path: "lambda/appsyncMutationRequest",
			description: "Update DB API",
			runtime: lambda.Runtime.NODEJS_18_X,
			environment: {
				API_ENDPOINT: props.api.graphqlUrl,
				API_QUERY: appsyncQuery_createJobItem,
				API_REGION: cdk.Stack.of(this).region,
			},
			bundlingNodeModules: ["@aws-crypto/sha256-js"],
		});
		updateDbLambda.lambdaRole?.attachInlinePolicy(iamPolicyGraphqlQuery);

		const updateDb = new tasks.LambdaInvoke(
			this,
			"updateDb",
			{
				lambdaFunction: updateDbLambda.lambdaFunction,
				resultPath: sfn.JsonPath.DISCARD,
				payload: sfn.TaskInput.fromObject({
					id: sfn.JsonPath.objectAt("$.jobDetails.id"),
					order: sfn.JsonPath.objectAt("$.index"),
					modelId: sfn.JsonPath.objectAt("$.jobDetails.modelId"),
					input: sfn.JsonPath.objectAt("$.value"),
					identity: sfn.JsonPath.objectAt("$.jobDetails.identity"),
					owner: sfn.JsonPath.objectAt("$.jobDetails.owner"),
					type: "text",
				}),
			},
		);


		// STATE MACHINE | TASKS | createJobItem
		const iamPolicyGraphqlQueryParseDoc = new iam.Policy(
			this,
			"iamPolicyGraphqlQueryUpdateParseDoc",
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
		const updateDbLambdaParseDoc = new dt_lambda(this, "updateDbLambdaParseDoc", {
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
		updateDbLambdaParseDoc.lambdaRole?.attachInlinePolicy(iamPolicyGraphqlQueryParseDoc);

		const documentImportKey = "documentImport"
		const updateDbParseDocProcessing = new tasks.LambdaInvoke(
			this,
			"updateDbParseDocProcessing",
			{
				lambdaFunction: updateDbLambdaParseDoc.lambdaFunction,
				resultPath: sfn.JsonPath.DISCARD,
				payload: sfn.TaskInput.fromObject({
					id: sfn.JsonPath.objectAt("$.jobDetails.id"),
					itemId: documentImportKey,
					status: "processing",
				}),
			},
		);

		const updateDbParseDocCompleted = new tasks.LambdaInvoke(
			this,
			"updateDbParseDocCompleted",
			{
				lambdaFunction: updateDbLambdaParseDoc.lambdaFunction,
				resultPath: sfn.JsonPath.DISCARD,
				payload: sfn.TaskInput.fromObject({
					id: sfn.JsonPath.objectAt("$.jobDetails.id"),
					itemId: documentImportKey,
					status: "completed",
				}),
			},
		);

		//
		// STATE MACHINE
		// STATE MACHINE | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_ReadableParseDoc`,
			{
				nameSuffix: "ReadableParseDoc",
				removalPolicy: props.removalPolicy,
				definition: 
					// updateDbParseDocProcessing
					// .next(
						docToHtml
					// )
					.next(htmlToMd)
					.next(splitMd)
					.next(
						iterateMd
						.itemProcessor(updateDb)
					)
					// .next(updateDbParseDocCompleted)
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
							docToHtmlLambda.lambdaFunction.node.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							htmlToMdLambda.lambdaFunction.node.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							splitMdLambda.lambdaFunction.node.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
					],
				},
			],
			true,
		);

		// END
	}
}
