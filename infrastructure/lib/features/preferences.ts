// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

import {
	aws_dynamodb as dynamodb,
	aws_s3 as s3,
	aws_appsync as appsync,
} from "aws-cdk-lib";
import {
	CodeFirstSchema,
	GraphqlType,
	ObjectType as OutputType,
	ResolvableField,
	Directive,
} from "awscdk-appsync-utils";

export interface props {
	api: appsync.GraphqlApi;
	apiSchema: CodeFirstSchema;
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_sharedPreferences extends Construct {
	public readonly contentBucket: s3.Bucket;
	public readonly jobTable: dynamodb.Table;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		const pk = "id";
		//
		// DYNAMODB
		const table = new dynamodb.Table(this, "userPreferencesTable", {
			partitionKey: {
				name: pk,
				type: dynamodb.AttributeType.STRING,
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
			pointInTimeRecovery: true, // ASM-DDB3
			removalPolicy: props.removalPolicy, // ASM-CFN1
		});

		// API
		const apiDataSource = props.api.addDynamoDbDataSource(
			"apiDsPreferencesTable",
			table,
		);

		// API | GET
		const apiOutput = new OutputType("shared_preferences_output", {
			definition: {
				visualMode: GraphqlType.string(),
				visualDensity: GraphqlType.string(),
			},
		});
		props.apiSchema.addType(apiOutput);

		const apiQuery = new ResolvableField({
			returnType: apiOutput.attribute(),
			dataSource: apiDataSource,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
            {
                "version": "2017-02-28",
                "operation": "GetItem",
                "key": {
                    "${pk}": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
                }
            }`),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addQuery("sharedGetPreferences", apiQuery);

		const apiMutation = new ResolvableField({
			returnType: apiOutput.attribute(),
			args: {
				visualMode: GraphqlType.string(),
				visualDensity: GraphqlType.string(),
			},
			dataSource: apiDataSource,
			requestMappingTemplate: appsync.MappingTemplate.fromString(`
				{
					"version" : "2017-02-28",
					"operation" : "UpdateItem",
                    "key": {
                        "${pk}": $util.dynamodb.toDynamoDBJson($ctx.identity.sub),
                    },
					"update": {
						"expression": "SET #if($removeNewLine)
							#end #if($ctx.args.visualMode)      #visualMode    = :visualMode    #end #if($removeNewLine)
							#end #if($ctx.args.visualDensity) , #visualDensity = :visualDensity #end #if($removeNewLine)
							#end ",
						"expressionNames": {
							#if($ctx.args.visualMode)        "#visualMode":    "visualMode"    #end
							#if($ctx.args.visualDensity)   , "#visualDensity": "visualDensity" #end
						},
						"expressionValues": {
							#if($ctx.args.visualMode)      ":visualMode":    $util.dynamodb.toDynamoDBJson($ctx.args.visualMode)    #end
							#if($ctx.args.visualDensity) , ":visualDensity": $util.dynamodb.toDynamoDBJson($ctx.args.visualDensity) #end
						}
					}
				}
		`),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addMutation("sharedUpdatePreferences", apiMutation);

		// END
	}
}
