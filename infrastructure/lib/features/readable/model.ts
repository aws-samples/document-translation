// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

import { aws_dynamodb as dynamodb, aws_appsync as appsync } from "aws-cdk-lib";
import {
	CodeFirstSchema,
	GraphqlType,
	ObjectType as OutputType,
	ResolvableField,
	Directive,
} from "awscdk-appsync-utils";

import * as dt_enums from "./enum";

export interface props {
	api: appsync.GraphqlApi;
	apiSchema: CodeFirstSchema;
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_readableModel extends Construct {
	public readonly modelTable: dynamodb.Table;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// DYNAMODB
		this.modelTable = new dynamodb.Table(this, "modelTable", {
			partitionKey: {
				name: "id",
				type: dynamodb.AttributeType.STRING,
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
			pointInTimeRecovery: true, // ASM-DDB3
			removalPolicy: props.removalPolicy, // ASM-CFN1
		});

		// API
		// API | DATA SOURCE
		const apiDsModelTable = props.api.addDynamoDbDataSource(
			`${dt_enums.Feature.PREFIX}ModelTable`,
			this.modelTable,
		);

		// API | QUERY listModel
		// OUTPUT
		const getModel_output_item = new OutputType(
			`${dt_enums.Feature.PREFIX}_getModel_output_item`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					name: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string({ isRequired: true }),
					default: GraphqlType.boolean(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		const getModel_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_getModel_output`,
			{
				definition: {
					items: getModel_output_item.attribute({ isList: true }),
					nextToken: GraphqlType.string(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(getModel_output_item);
		props.apiSchema.addType(getModel_output);

		// QUERY
		const listModelsQuery = new ResolvableField({
			returnType: getModel_output.attribute({ isList: true }),
			args: {
				limit: GraphqlType.int(),
				nextToken: GraphqlType.string(),
			},
			dataSource: apiDsModelTable,
			requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addQuery(
			`${dt_enums.Feature.PREFIX}ListModels`,
			listModelsQuery,
		);

		// END
	}
}
