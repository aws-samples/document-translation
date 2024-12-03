// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

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
	apiDsJobTable: appsync.DynamoDbDataSource;
	apiSchema: CodeFirstSchema;
	jobTable: dynamodb.Table;
	modelTable: dynamodb.Table;
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_readableItem extends Construct {
	public readonly updateJobItemMutation_name: string;
	public readonly createJobItemMutation_name: string;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// API

		// create & update common
		const jobItemCommon_input = {
			id: GraphqlType.id({ isRequired: true }),
			parent: GraphqlType.string(),
			input: GraphqlType.string(),
			modelId: GraphqlType.string(),
			output: GraphqlType.string(),
			owner: GraphqlType.string(),
			status: GraphqlType.string(),
		}
		const jobItemCommon_output = {
			id: GraphqlType.id({ isRequired: true }),
			itemId: GraphqlType.id({ isRequired: true }),
			parent: GraphqlType.string(),
			input: GraphqlType.string(),
			modelId: GraphqlType.string(),
			owner: GraphqlType.string(),
			output: GraphqlType.string(),
			status: GraphqlType.string(),
		}

		// API | MUTATION createJobItem
		// INPUT
		const createJobItem_input = new InputType(
			`${dt_enums.Feature.PREFIX}_createJobItem_input`,
			{
				definition: {
					order: GraphqlType.int({ isRequired: true }),
					identity: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string({ isRequired: true }),
					...jobItemCommon_input,
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
					Directive.iam(),
				],
			},
		);
		props.apiSchema.addType(createJobItem_input);
		// OUTPUT
		const createJobItem_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_createJobItem_output`,
			{
				definition: {
					order: GraphqlType.int({ isRequired: true }),
					identity: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string({ isRequired: true }),
					...jobItemCommon_output,
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
					Directive.iam(),
				],
			},
		);
		props.apiSchema.addType(createJobItem_output);

		// MUTATION
		const createJobItemMutation = new ResolvableField({
			returnType: createJobItem_output.attribute(),
			dataSource: props.apiDsJobTable,
			args: createJobItem_input.definition,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set( $timestamp = $util.time.nowEpochSeconds() )
				#if($ctx.identity.sub) #set( $isUserCognito = true ) #end

				{
					"version" : "2017-02-28",
					"operation" : "PutItem",
					"key" : {
						"id": $util.dynamodb.toDynamoDBJson( $ctx.args.id ),
						"itemId":  $util.dynamodb.toDynamoDBJson( $util.autoId() ),
					},
					"condition": {
						"expression": "attribute_not_exists(itemId)"
					},
					"attributeValues" :{
						#if($isUserCognito)   "${dt_enums.JobTable.GSI_OWNER_PK}": $util.dynamodb.toDynamoDBJson( $ctx.identity.sub ), #end
						#if(! $isUserCognito) "${dt_enums.JobTable.GSI_OWNER_PK}": $util.dynamodb.toDynamoDBJson( $ctx.args.owner ),   #end
						"order": $util.dynamodb.toDynamoDBJson( $ctx.args.order) ,
						"identity": $util.dynamodb.toDynamoDBJson( $ctx.args.identity) ,
						#if($ctx.args.parent)  "parent":  $util.dynamodb.toDynamoDBJson( $ctx.args.parent  ), #end
						#if($ctx.args.status)  "status":  $util.dynamodb.toDynamoDBJson( $ctx.args.status  ), #end
						#if($ctx.args.input)   "input":   $util.dynamodb.toDynamoDBJson( $ctx.args.input   ), #end
						#if($ctx.args.modelId) "modelId": $util.dynamodb.toDynamoDBJson( $ctx.args.modelId ), #end
						"type": $util.dynamodb.toDynamoDBJson( $ctx.args.type )
					}
				}
			`),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [
				Directive.custom("@aws_cognito_user_pools"),
				Directive.iam(),
			],
		});
		this.createJobItemMutation_name = `${dt_enums.Feature.PREFIX}CreateJobItem`;
		props.apiSchema.addMutation(
			this.createJobItemMutation_name,
			createJobItemMutation,
		);

		// API | MUTATION updateJobItem
		// INPUT
		const updateJobItem_input = new InputType(
			`${dt_enums.Feature.PREFIX}_updateJobItem_input`,
			{
				definition: {
					order: GraphqlType.int(),
					itemId: GraphqlType.id({ isRequired: true }),
					type: GraphqlType.string(),
					identity: GraphqlType.string(),
					...jobItemCommon_input,
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
					Directive.iam(),
				],
			},
		);
		props.apiSchema.addType(updateJobItem_input);

		// OUTPUT
		const updateJobItem_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_updateJobItem_output`,
			{
				definition: {
					type: GraphqlType.string(),
					order: GraphqlType.int(),
					identity: GraphqlType.string(),
					...jobItemCommon_output,
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
					Directive.iam(),
				],
			},
		);
		props.apiSchema.addType(updateJobItem_output);

		// MUTATION
		const updateJobItemMutation = new ResolvableField({
			returnType: updateJobItem_output.attribute(),
			args: updateJobItem_input.definition,
			dataSource: props.apiDsJobTable,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set( $timestamp = $util.time.nowEpochSeconds() )
				#if($ctx.identity.sub) #set( $isUserCognito = true ) #end

				{
					"version" : "2017-02-28",
					"operation" : "UpdateItem",
					"key" : {
						"id": $util.dynamodb.toDynamoDBJson( $ctx.args.id ),
						"itemId": $util.dynamodb.toDynamoDBJson( $ctx.args.itemId )
					},
					#if($isUserCognito)
						"condition": {
							"expression": "#ownerField = :requestUser AND NOT #statusField = :statusProcessing",
							"expressionNames": {
								"#ownerField": "${dt_enums.JobTable.GSI_OWNER_PK}",
								"#statusField": "${dt_enums.JobTable.STATUS_KEY}"
							},
							"expressionValues": {
								":requestUser": $util.dynamodb.toDynamoDBJson( $ctx.identity.sub ),
								":statusProcessing": $util.dynamodb.toDynamoDBJson("${dt_enums.ItemStatus.PROCESSING}")
							}
						},
					#end
					"update": {
						"expression": "SET #if($removeNewLine)
							#end #if($ctx.args.status)     #status   = :status   #end #if($removeNewLine)
							#end #if($ctx.args.input)    , #input    = :input    #end #if($removeNewLine)
							#end #if($ctx.args.type)     , #type     = :type     #end #if($removeNewLine)
							#end #if($ctx.args.modelId)  , #modelId  = :modelId  #end #if($removeNewLine)
							#end #if($ctx.args.order)    , #order    = :order    #end #if($removeNewLine)
							#end #if($ctx.args.output)   , #output   = :output   #end #if($removeNewLine)
							#end #if($ctx.args.parent)   , #parent   = :parent   #end #if($removeNewLine)
							#end #if($ctx.args.identity) , #identity = :identity #end #if($removeNewLine)
							#end ",
						"expressionNames": {
							#if($ctx.args.status)       "#status":   "status"   #end
							#if($ctx.args.input)      , "#input":    "input"    #end
							#if($ctx.args.type)       , "#type":     "type"     #end
							#if($ctx.args.modelId)    , "#modelId":  "modelId"  #end
							#if($ctx.args.order)      , "#order":    "order"    #end
							#if($ctx.args.output)     , "#output":   "output"   #end
							#if($ctx.args.parent)     , "#parent":   "parent"   #end
							#if($ctx.args.identity)   , "#identity": "identity" #end
						},
						"expressionValues": {
							#if($ctx.args.status)     ":status":   $util.dynamodb.toDynamoDBJson($ctx.args.status)   #end
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
			responseMappingTemplate: appsync.MappingTemplate.fromString(`
				#if( $ctx.identity.sub ) #set( $isUserCognito = true ) #end
				#if( ! $isUserCognito )  #set( $isUserLambda  = true ) #end
				#if( $ctx.result.owner == $ctx.identity.sub ) #set( $isRequesterOwner = true ) #end
				
				#if($isUserLambda || $isRequesterOwner)
					$util.toJson($ctx.result)
				#else 
					$utils.unauthorized()
				#end
			`),
			directives: [
				Directive.custom("@aws_cognito_user_pools"),
				Directive.iam(),
			],
		});
		this.updateJobItemMutation_name = `${dt_enums.Feature.PREFIX}UpdateJobItem`;
		props.apiSchema.addMutation(
			this.updateJobItemMutation_name,
			updateJobItemMutation,
		);

		// SUBSCRIPTION
		// SUBSCRIPTION | updateJobItem
		const subscribeUpdateJobItemSubscription = new Field({
			returnType: updateJobItem_output.attribute(),
			args: {
				id: GraphqlType.id({ isRequired: true }),
				itemId: GraphqlType.id(),
			},
			directives: [
				Directive.custom("@aws_cognito_user_pools"),
				Directive.subscribe(this.updateJobItemMutation_name),
			],
		});
		props.apiSchema.addSubscription(
			this.updateJobItemMutation_name,
			subscribeUpdateJobItemSubscription,
		);

		// END
	}
}
