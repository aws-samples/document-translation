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

export class dt_help extends Construct {
	public readonly contentBucket: s3.Bucket;
	public readonly jobTable: dynamodb.Table;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		//
		// DYNAMODB
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

		// API
		// API | DATA SOURCE
		const apiDsHelpTable = props.api.addDynamoDbDataSource(
			"apiDsHelpTable",
			helpTable,
			);
			
		// API | DATA SOURCE
		// API | INPUT
		// NA
		// API | OUTPUT
		const listHelps_output = new OutputType("help_listHelps_output", {
			definition: {
				description: GraphqlType.string(),
				id: GraphqlType.id({ isRequired: true }),
				link: GraphqlType.string(),
				order: GraphqlType.int(),
				title: GraphqlType.string(),
			},
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addType(listHelps_output);

		const listHelpsQuery = new ResolvableField({
			returnType: listHelps_output.attribute({ isList: true, isRequired: true }),
			args: {
				limit: GraphqlType.int(),
				nextToken: GraphqlType.string(),
			},
			dataSource: apiDsHelpTable,
			requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
		});
		props.apiSchema.addQuery("helpListHelps", listHelpsQuery);

		// END
	}
}
