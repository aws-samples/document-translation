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

export class dt_readablePrintStyles extends Construct {
	public readonly printStyleTable: dynamodb.Table;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// DYNAMODB
		this.printStyleTable = new dynamodb.Table(this, "printStyleTable", {
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
		const apiDsPrintStyleTable = props.api.addDynamoDbDataSource(
			`${dt_enums.Feature.PREFIX}PrintStyleTable`,
			this.printStyleTable,
		);

		// API | QUERY listStyles
		// OUTPUT
		const getStyle_output_item = new OutputType(
			`${dt_enums.Feature.PREFIX}_getPrintStyle_output_item`,
			{
				definition: {
					id: GraphqlType.string({ isRequired: true }),
					name: GraphqlType.string({ isRequired: true }),
					type: GraphqlType.string({ isRequired: true }),
					css: GraphqlType.string(),
					default: GraphqlType.boolean(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		const getStyle_output = new OutputType(
			`${dt_enums.Feature.PREFIX}_getPrintStyle_output`,
			{
				definition: {
					items: getStyle_output_item.attribute({ isList: true }),
					nextToken: GraphqlType.string(),
				},
				directives: [Directive.custom("@aws_cognito_user_pools")],
			},
		);
		props.apiSchema.addType(getStyle_output_item);
		props.apiSchema.addType(getStyle_output);

		// QUERY
		const listStylesQuery = new ResolvableField({
			returnType: getStyle_output.attribute(),
			args: {
				limit: GraphqlType.int(),
				nextToken: GraphqlType.string(),
			},
			dataSource: apiDsPrintStyleTable,
			requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addQuery(
			`${dt_enums.Feature.PREFIX}ListPrintStyles`,
			listStylesQuery,
		);

		// END
	}
}
