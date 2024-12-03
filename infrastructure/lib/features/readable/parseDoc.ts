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
	aws_dynamodb as dynamodb,
	aws_pipes as pipes,
} from "aws-cdk-lib";

import {
	CodeFirstSchema,
	GraphqlType,
	ObjectType as OutputType,
	InputType,
	ResolvableField,
	Directive,
} from "awscdk-appsync-utils";

import * as dt_enums from "./enum";
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
	api: appsync.GraphqlApi;
	apiSchema: CodeFirstSchema;
	apiDsJobTable: appsync.DynamoDbDataSource;
	contentBucket: s3.Bucket;
	createJobItemMutation_name: string;
	jobTable: dynamodb.Table;
	removalPolicy: cdk.RemovalPolicy;
	updateJobItemMutation_name: string;
}

export class dt_readableWorkflowParseDoc extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// STATE MACHINE | TASKS | unNestJobDetails
		const unNestJobDetails = new sfn.Pass(this, "unNestJobDetails", {
			parameters: {
				dynamodb: sfn.JsonPath.objectAt("$.[0].dynamodb"),
			},
		});
		// STATE MACHINE | TASKS | unmarshallDdb
		const unmarshallDdbLambda = new dt_lambda(this, "unmarshallDdbLambda", {
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

		// LAMBDA
		// LAMBDA | DOC TO HTML
		// LAMBDA | DOC TO HTML | ROLE
		const permitBucket = new iam.Policy(this, "permitBucket", {
			policyName: "Permit-read-write-to-bucket-for-doc-parsing",
			statements: [
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["s3:ListBucket"],
					resources: [`${props.contentBucket.bucketArn}`],
				}),
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["s3:getObject", "s3:putObject"],
					resources: [`${props.contentBucket.bucketArn}/*`],
				}),
			],
		});
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
				BUCKET_NAME: props.contentBucket.bucketName,
			},
			timeout: cdk.Duration.minutes(1),
		});
		docToHtmlLambda.lambdaRole.attachInlinePolicy(permitBucket);

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
				BUCKET_NAME: props.contentBucket.bucketName,
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
				BUCKET_NAME: props.contentBucket.bucketName,
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

		const updateDb = new tasks.LambdaInvoke(this, "updateDb", {
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
		});

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
		const updateDbLambdaParseDoc = new dt_lambda(
			this,
			"updateDbLambdaParseDoc",
			{
				path: "lambda/appsyncMutationRequest",
				description: "Update DB API",
				runtime: lambda.Runtime.NODEJS_18_X,
				environment: {
					API_ENDPOINT: props.api.graphqlUrl,
					API_QUERY: appsyncQuery_updateJobItem,
					API_REGION: cdk.Stack.of(this).region,
				},
				bundlingNodeModules: ["@aws-crypto/sha256-js"],
			},
		);
		updateDbLambdaParseDoc.lambdaRole?.attachInlinePolicy(
			iamPolicyGraphqlQueryParseDoc,
		);

		const updateDbParseDocProcessing = new tasks.LambdaInvoke(
			this,
			"updateDbParseDocProcessing",
			{
				lambdaFunction: updateDbLambdaParseDoc.lambdaFunction,
				resultPath: sfn.JsonPath.DISCARD,
				payload: sfn.TaskInput.fromObject({
					id: sfn.JsonPath.objectAt("$.jobDetails.id"),
					itemId: dt_enums.JobTable.SK_DOCIMPORT,
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
					itemId: dt_enums.JobTable.SK_DOCIMPORT,
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
				comment: `
					[{"NewImage": {
						"id":       { "S": "aaaa-bbbb-cccc-dddd-eeee-ffff" },
						"identity": { "S": "noIdentity" },
						"itemId":   { "S": "documentImport" },
						"key":      { "S": "private/test-region-1:0123456789/testId/test.docx" },
						"modelId":  { "S": "modelId" },
						"owner":    { "S": "noOwner" },
						"status":   { "S": "docimport" }
					}}]
				`,
				definition: unNestJobDetails
					.next(unmarshallDdbStream)
					// .next(updateDbParseDocProcessing)
					.next(docToHtml)
					.next(htmlToMd)
					.next(splitMd)
					.next(iterateMd.itemProcessor(updateDb)),
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
							docToHtmlLambda.lambdaFunction.node
								.defaultChild as cdk.CfnElement,
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
				new iam.Policy(this, "permitStartExecutionOfParseDoc", {
					policyName: "Start-Sfn-ReadablenParseDoc",
					statements: [
						new iam.PolicyStatement({
							// ASM-IAM
							actions: ["states:StartExecution"],
							resources: [this.sfnMain.stateMachineArn],
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
						itemId: {
							S: [
								{
									"equals-ignore-case": dt_enums.JobTable.SK_DOCIMPORT,
								},
							],
						},
						status: {
							S: [
								{
									"equals-ignore-case": dt_enums.ItemStatus.DOCIMPORT,
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
				target: this.sfnMain.stateMachineArn,
				description: "DocTran Readable Job to StepFunction PraseDoc",
				sourceParameters,
				targetParameters,
			});
		}


		// API
		// API | MUTATION createJobImport
		// INPUT
		const createJobImport_input = new InputType(
			`${dt_enums.Feature.PREFIX}_createJobImport_input`,
			{
				definition: {
					identity: GraphqlType.string(),
					id: GraphqlType.id({ isRequired: true }),
					modelId: GraphqlType.string(),
					status: GraphqlType.string(),
					key: GraphqlType.string(),
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
					Directive.iam(),
				],
			},
		);
		props.apiSchema.addType(createJobImport_input);
		// OUTPUT
		const createJobImport_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_createJobImport_output`,
			{
				definition: {
					id: GraphqlType.id({ isRequired: true }),
					modelId: GraphqlType.string(),
					status: GraphqlType.string(),
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
				],
			},
		);
		props.apiSchema.addType(createJobImport_output);

		// MUTATION
		const createJobImportMutation = new ResolvableField({
			returnType: createJobImport_output.attribute(),
			dataSource: props.apiDsJobTable,
			args: createJobImport_input.definition,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set( $timestamp = $util.time.nowEpochSeconds() )
				#if($ctx.identity.sub) #set( $isUserCognito = true ) #end

				{
					"version" : "2017-02-28",
					"operation" : "UpdateItem",
					"key" : {
						"id": $util.dynamodb.toDynamoDBJson( $ctx.args.id ),
						"itemId":  $util.dynamodb.toDynamoDBJson( "${dt_enums.ItemStatus.DOCIMPORT}" ),
					},
					"update": {
						"expression": "SET #if($removeNewLine)
							#end                           #owner    = :owner         #if($removeNewLine)
							#end #if($ctx.args.status)   , #status   = :status   #end #if($removeNewLine)
							#end #if($ctx.args.input)    , #input    = :input    #end #if($removeNewLine)
							#end #if($ctx.args.type)     , #type     = :type     #end #if($removeNewLine)
							#end #if($ctx.args.modelId)  , #modelId  = :modelId  #end #if($removeNewLine)
							#end #if($ctx.args.order)    , #order    = :order    #end #if($removeNewLine)
							#end #if($ctx.args.output)   , #output   = :output   #end #if($removeNewLine)
							#end #if($ctx.args.parent)   , #parent   = :parent   #end #if($removeNewLine)
							#end #if($ctx.args.identity) , #identity = :identity #end #if($removeNewLine)
							#end ",
						"expressionNames": {
														"#owner":    "owner"
							#if($ctx.args.status)     , "#status":   "status"   #end
							#if($ctx.args.input)      , "#input":    "input"    #end
							#if($ctx.args.type)       , "#type":     "type"     #end
							#if($ctx.args.modelId)    , "#modelId":  "modelId"  #end
							#if($ctx.args.order)      , "#order":    "order"    #end
							#if($ctx.args.output)     , "#output":   "output"   #end
							#if($ctx.args.parent)     , "#parent":   "parent"   #end
							#if($ctx.args.identity)   , "#identity": "identity" #end
						},
						"expressionValues": {
							#if($isUserCognito)       ":owner":    $util.dynamodb.toDynamoDBJson($ctx.identity.sub)  #end
							#if(! $isUserCognito)     ":owner":    $util.dynamodb.toDynamoDBJson($ctx.args.owner)    #end
							#if($ctx.args.status)   , ":status":   $util.dynamodb.toDynamoDBJson($ctx.args.status)   #end
							#if($ctx.args.input)    , ":input":    $util.dynamodb.toDynamoDBJson($ctx.args.input)    #end
							#if($ctx.args.type)     , ":type":     $util.dynamodb.toDynamoDBJson($ctx.args.type)     #end
							#if($ctx.args.modelId)  , ":modelId":  $util.dynamodb.toDynamoDBJson($ctx.args.modelId)  #end
							#if($ctx.args.order)    , ":order":    $util.dynamodb.toDynamoDBJson($ctx.args.order)    #end
							#if($ctx.args.output)   , ":output":   $util.dynamodb.toDynamoDBJson($ctx.args.output)   #end
							#if($ctx.args.parent)   , ":parent":   $util.dynamodb.toDynamoDBJson($ctx.args.parent)   #end
							#if($ctx.args.identity) , ":identity": $util.dynamodb.toDynamoDBJson($ctx.args.identity) #end
						}
					}
				}
			`),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [
				Directive.custom("@aws_cognito_user_pools"),
				Directive.iam(),
			],
		});
		const createJobImportMutation_name = `${dt_enums.Feature.PREFIX}CreateJobImport`;
		props.apiSchema.addMutation(
			createJobImportMutation_name,
			createJobImportMutation,
		);

		// END
	}
}
