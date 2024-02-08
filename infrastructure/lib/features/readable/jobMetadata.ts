// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import { aws_dynamodb as dynamodb, aws_appsync as appsync } from "aws-cdk-lib";
import {
	CodeFirstSchema,
	GraphqlType,
	ObjectType as OutputType,
	InputType,
	ResolvableField,
	Field,
	Directive,
} from "awscdk-appsync-utils";

import * as dt_enums from "./enum";

export interface props {
	api: appsync.GraphqlApi;
	apiSchema: CodeFirstSchema;
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_readableJob extends Construct {
	public readonly jobTable: dynamodb.Table;
	public readonly apiDsJobTable: appsync.DynamoDbDataSource;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// DYNAMODB
		// DYNAMODB | TABLE
		this.jobTable = new dynamodb.Table(this, "jobTable", {
			partitionKey: {
				name: dt_enums.JobTable.PK,
				type: dynamodb.AttributeType.STRING,
			},
			sortKey: {
				name: dt_enums.JobTable.SK,
				type: dynamodb.AttributeType.STRING,
			},
			stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
			pointInTimeRecovery: true, // ASM-DDB3
			removalPolicy: props.removalPolicy, // ASM-CFN1
		});

		// DYNAMODB | INDEX
		this.jobTable.addGlobalSecondaryIndex({
			indexName: "byOwnerAndUpdatedAt",
			partitionKey: {
				name: dt_enums.JobTable.GSI_OWNER_PK,
				type: dynamodb.AttributeType.STRING,
			},
			sortKey: {
				name: dt_enums.JobTable.GSI_OWNER_SK,
				type: dynamodb.AttributeType.NUMBER,
			},
			projectionType: dynamodb.ProjectionType.INCLUDE,
			nonKeyAttributes: [
				dt_enums.JobTable.GSI_OWNER_ATTR_CREATEDAT,
				dt_enums.JobTable.GSI_OWNER_ATTR_NAME,
			],
		});

		// API | DATA SOURCE
		this.apiDsJobTable = props.api.addDynamoDbDataSource(
			`${dt_enums.Feature.PREFIX}JobTable`,
			this.jobTable,
		);
		NagSuppressions.addResourceSuppressions(
			props.api,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permission is scoped to dedicated DDB table",
					appliesTo: [
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							this.jobTable.node.defaultChild as cdk.CfnElement,
						)}.Arn>/index/*`,
					],
				},
			],
			true,
		);

		// API | QUERY
		// API | QUERY listJobs
		// INPUT
		// NA
		// OUTPUT
		const listJobs_output_item = new OutputType(
			`${dt_enums.Feature.PREFIX}_listJobs_output_item`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					identity: GraphqlType.string(),
					name: GraphqlType.string(),
					createdAt: GraphqlType.int(),
					updatedAt: GraphqlType.int(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		const listJobs_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_listJobs_output`,
			{
				definition: {
					items: listJobs_output_item.attribute({ isList: true }),
					nextToken: GraphqlType.string(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(listJobs_output_item);
		props.apiSchema.addType(listJobs_output);

		// QUERY
		const listJobsQuery = new ResolvableField({
			returnType: listJobs_output.attribute(),
			dataSource: this.apiDsJobTable,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
			{
				"version": "2017-02-28",
				"operation": "Query",
				"index": "${dt_enums.JobTable.GSI_OWNER}",
				"query": {
					"expression": "#owner = :sub",
					"expressionNames": {
						"#owner": "${dt_enums.JobTable.GSI_OWNER_PK}"
					},
					"expressionValues": {
						":sub": $util.dynamodb.toDynamoDBJson($ctx.identity.sub)
					}
				}
			}
		`),
			responseMappingTemplate: appsync.MappingTemplate.fromString(`
				{
					"items": $util.toJson($ctx.result.items),
					"nextToken": $util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))
				}
			`),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addQuery(
			`${dt_enums.Feature.PREFIX}ListJobs`,
			listJobsQuery,
		);

		// API | QUERY getJob
		// INPUT
		const getJob_input = new InputType(
			`${dt_enums.Feature.PREFIX}_getJob_input`,
			{
				definition: {
					id: GraphqlType.id({ isRequired: true }),
				},
			},
		);
		props.apiSchema.addType(getJob_input);
		// OUTPUT
		const getJob_output_item = new OutputType(
			`${dt_enums.Feature.PREFIX}_getJob_output_item`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					itemId: GraphqlType.string({ isRequired: true }),
					identity: GraphqlType.string(),
					// Job specific
					name: GraphqlType.string(),
					createdAt: GraphqlType.int(),
					updatedAt: GraphqlType.int(),
					// Item specific
					input: GraphqlType.string(),
					modelId: GraphqlType.string(),
					order: GraphqlType.int(),
					output: GraphqlType.string(),
					parent: GraphqlType.string(),
					status: GraphqlType.string(),
					type: GraphqlType.string(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		const getJob_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_getJob_output`,
			{
				definition: {
					items: getJob_output_item.attribute({ isList: true }),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(getJob_output_item);
		props.apiSchema.addType(getJob_output);

		// QUERY
		const getJobQuery = new ResolvableField({
			returnType: getJob_output.attribute(),
			dataSource: this.apiDsJobTable,
			args: getJob_input.definition,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
			{
				"version": "2017-02-28",
				"operation": "Query",
				"query": {
					"expression": "#pk = :requestId",
					"expressionNames": {
						"#pk": "${dt_enums.JobTable.PK}"
					},
					"expressionValues": {
						":requestId": $util.dynamodb.toDynamoDBJson($ctx.args.id)
					}
				}
			}
		`),
			responseMappingTemplate: appsync.MappingTemplate.fromString(`
			#set($filteredResults = [])
			#foreach($item in $ctx.result.items)
				#if($item.owner == $ctx.identity.sub)
					#set($added = $filteredResults.add($item))
				#end
			#end
			
			{
				"items": $util.toJson($filteredResults),
				"nextToken": $util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))
			}
		`),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addQuery(`${dt_enums.Feature.PREFIX}GetJob`, getJobQuery);

		// API | MUTATION
		// API | MUTATION createJob
		// INPUT
		const createJob_input = new InputType(
			`${dt_enums.Feature.PREFIX}_createJob_input`,
			{
				definition: {
					identity: GraphqlType.string({ isRequired: true }),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(createJob_input);

		// OUTPUT
		const createJob_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_createJob_output`,
			{
				definition: {
					id: GraphqlType.id({ isRequired: true }),
					identity: GraphqlType.string({ isRequired: true }),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(createJob_output);

		// MUTATION
		const createJobMutation = new ResolvableField({
			returnType: createJob_output.attribute(),
			args: createJob_input.definition,
			dataSource: this.apiDsJobTable,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
			#set( $timestamp = $util.time.nowEpochSeconds() )
			{
				"version" : "2017-02-28",
				"operation" : "PutItem",
				"key" : {
					"id": $util.dynamodb.toDynamoDBJson( $util.autoId() ),
					"itemId": $util.dynamodb.toDynamoDBJson( "${dt_enums.JobTable.SK_METADATA}" ),
				},
				"condition": {
					"expression": "attribute_not_exists(id)"
				},
				"attributeValues" : $util.dynamodb.toMapValuesJson({
					"${dt_enums.JobTable.GSI_OWNER_PK}": $ctx.identity.sub,
					"${dt_enums.JobTable.GSI_OWNER_SK}": $timestamp,
					"identity": $ctx.args.identity,
					"createdAt": $timestamp
				})
			}
		`),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});

		props.apiSchema.addMutation(
			`${dt_enums.Feature.PREFIX}CreateJob`,
			createJobMutation,
		);

		// API | MUTATION updateJobMetadata
		// INPUT
		const updateJobMetadata_input = new InputType(
			`${dt_enums.Feature.PREFIX}_updateJobMetadata_input`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					name: GraphqlType.string(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(updateJobMetadata_input);

		// OUTPUT
		const updateJobMetadata_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_updateJobMetadata_output`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					name: GraphqlType.string(),
					createdAt: GraphqlType.int(),
					owner: GraphqlType.string(),
					updatedAt: GraphqlType.int(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(updateJobMetadata_output);

		// MUTATION
		const updateJobMetadataMutation = new ResolvableField({
			returnType: updateJobMetadata_output.attribute(),
			args: updateJobMetadata_input.definition,
			dataSource: this.apiDsJobTable,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set( $timestamp = $util.time.nowEpochSeconds() )
				{
					"version" : "2017-02-28",
					"operation" : "UpdateItem",
					"key" : {
						"id": $util.dynamodb.toDynamoDBJson( $ctx.args.id ),
						"itemId": $util.dynamodb.toDynamoDBJson( "${dt_enums.JobTable.SK_METADATA}" ),
					},
					"condition": {
						"expression": "#currentOwner = :currentOwner",
						"expressionNames": {
							"#currentOwner": "${dt_enums.JobTable.GSI_OWNER_PK}"
						},
						"expressionValues": {
							":currentOwner": $util.dynamodb.toDynamoDBJson( $ctx.identity.sub )
						}
					},
					"update": {
						"expression": "SET #name = :name, #updatedAt = :updatedAt",
						"expressionNames": {
							"#name": "name",
							"#updatedAt": "${dt_enums.JobTable.GSI_OWNER_SK}"
						},  
						"expressionValues": {
							":name": $util.dynamodb.toDynamoDBJson( $ctx.args.name ),
							":${dt_enums.JobTable.GSI_OWNER_SK}": $util.dynamodb.toDynamoDBJson($timestamp)
						}
					}
				}
			`),
			responseMappingTemplate: appsync.MappingTemplate.fromString(`
				#if($ctx.result.owner == $ctx.identity.sub)
					$util.toJson($ctx.result)
				#else
					$utils.unauthorized()
				#end
			`),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		const updateJobMetadataMutation_name = `${dt_enums.Feature.PREFIX}UpdateJobMetadata`;
		props.apiSchema.addMutation(updateJobMetadataMutation_name, updateJobMetadataMutation);

		// SUBSCRIPTION | updateJobMetadata
		const subscribeUpdateJobMetadataSubscription = new Field({
			returnType: updateJobMetadata_output.attribute(),
			args: {
				id: GraphqlType.id({ isRequired: true }),
			},
			directives: [
				Directive.custom("@aws_cognito_user_pools"),
				Directive.subscribe(updateJobMetadataMutation_name),
			],
		});
		props.apiSchema.addSubscription(
			updateJobMetadataMutation_name,
			subscribeUpdateJobMetadataSubscription,
		);

		// END
	}
}
