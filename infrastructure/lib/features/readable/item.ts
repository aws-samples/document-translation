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
	apiDsJobTable: appsync.DynamoDbDataSource;
	apiSchema: CodeFirstSchema;
	jobTable: dynamodb.Table;
	modelTable: dynamodb.Table;
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_readableItem extends Construct {
	public readonly updateItemMutation_name: string;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// API
		// API | MUTATION createItem
		// INPUT
		const createItem_input = new InputType(
			`${dt_enums.Feature.PREFIX}_createItem_input`,
			{
				definition: {
					id: GraphqlType.id({ isRequired: true }),
					order: GraphqlType.int({ isRequired: true }),
					identity: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string({ isRequired: true }),
					parent: GraphqlType.string(),
				},
			},
		);
		props.apiSchema.addType(createItem_input);
		// OUTPUT
		const createItem_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_createItem_output`,
			{
				definition: {
					id: GraphqlType.id({ isRequired: true }),
					itemId: GraphqlType.id({ isRequired: true }),
					order: GraphqlType.int({ isRequired: true }),
					identity: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string({ isRequired: true }),
					parent: GraphqlType.string(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(createItem_output);

		// MUTATION
		const createItemMutation = new ResolvableField({
			returnType: createItem_output.attribute(),
			dataSource: props.apiDsJobTable,
			args: createItem_input.definition,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				#set( $timestamp = $util.time.nowEpochSeconds() )
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
						"${dt_enums.JobTable.GSI_OWNER_PK}": $util.dynamodb.toDynamoDBJson( $ctx.identity.sub ),
						"order": $util.dynamodb.toDynamoDBJson( $ctx.args.order) ,
						"identity": $util.dynamodb.toDynamoDBJson( $ctx.args.identity) ,
						#if($ctx.args.parent) "parent": $util.dynamodb.toDynamoDBJson( $ctx.args.parent ), #end
						"type": $util.dynamodb.toDynamoDBJson( $ctx.args.type )
					}
				}
			`),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});

		props.apiSchema.addMutation(
			`${dt_enums.Feature.PREFIX}CreateItem`,
			createItemMutation,
		);

		// API | MUTATION updateItem
		// INPUT
		const updateItem_input = new InputType(
			`${dt_enums.Feature.PREFIX}_updateItem_input`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					itemId: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string(),
					input: GraphqlType.string(),
					modelId: GraphqlType.string(),
					order: GraphqlType.int(),
					identity: GraphqlType.string(),
					output: GraphqlType.string(),
					status: GraphqlType.string(),
					parent: GraphqlType.string(),
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
					Directive.iam(),
				],
			},
		);
		props.apiSchema.addType(updateItem_input);

		// OUTPUT
		const updateItem_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_updateItem_output`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					itemId: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string(),
					input: GraphqlType.string(),
					modelId: GraphqlType.string(),
					order: GraphqlType.int(),
					owner: GraphqlType.string(),
					identity: GraphqlType.string(),
					output: GraphqlType.string(),
					status: GraphqlType.string(),
					parent: GraphqlType.string(),
				},
				directives: [
					Directive.custom("@aws_cognito_user_pools"),
					Directive.iam(),
				],
			},
		);
		props.apiSchema.addType(updateItem_output);

		// MUTATION
		const updateItemMutation = new ResolvableField({
			returnType: updateItem_output.attribute(),
			args: updateItem_input.definition,
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
		this.updateItemMutation_name = `${dt_enums.Feature.PREFIX}UpdateItem`;
		props.apiSchema.addMutation(
			this.updateItemMutation_name,
			updateItemMutation,
		);

		// SUBSCRIPTION
		// SUBSCRIPTION | updateItem
		const subscribeUpdateItemSubscription = new Field({
			returnType: updateItem_output.attribute(),
			args: {
				id: GraphqlType.id({ isRequired: true }),
				itemId: GraphqlType.id(),
			},
			directives: [
				Directive.custom("@aws_cognito_user_pools"),
				Directive.subscribe(this.updateItemMutation_name),
			],
		});
		props.apiSchema.addSubscription(
			this.updateItemMutation_name,
			subscribeUpdateItemSubscription,
		);

		// END
	}
}
