// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_dynamodb as dynamodb,
	aws_appsync as appsync,
	custom_resources as cr,
} from "aws-cdk-lib";
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
			returnType: getModel_output.attribute(),
			args: {
				limit: GraphqlType.int(),
				nextToken: GraphqlType.string(),
			},
			dataSource: apiDsModelTable,
			requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
			responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
			directives: [Directive.custom("@aws_cognito_user_pools")],
		});
		props.apiSchema.addQuery(
			`${dt_enums.Feature.PREFIX}ListModels`,
			listModelsQuery,
		);

		// EXAMPLE ENTRY
		// EXAMPLE ENTRY | TEXT
		new cr.AwsCustomResource(this, "exampleEntryText", {
			onCreate: {
				service: "DynamoDB",
				action: "putItem",
				parameters: {
					TableName: this.modelTable.tableName,
					Item: require("./defaults/text.anthropic-claude.ddb.json"),
				},
				physicalResourceId: cr.PhysicalResourceId.of("exampleEntryText"),
			},
			policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
				resources: [this.modelTable.tableArn],
			}),
			installLatestAwsSdk: true,
		});

		// https://github.com/aws/aws-cdk/issues/30067
		// // EXAMPLE ENTRY | TEXT
		// const exampleEntryText_amazonTitan = new cr.AwsCustomResource(this, 'exampleEntryText_amazonTitan', {
		// 	onCreate: {
		// 		service: 'DynamoDB',
		// 		action: 'putItem',
		// 		parameters: {
		// 			TableName: this.modelTable.tableName,
		// 			Item: require('./defaults/text.amazon-titan.ddb.json'),
		// 		},
		// 		physicalResourceId: cr.PhysicalResourceId.of('exampleEntryText_amazonTitan'),
		// 	},
		// 	policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
		// 		resources: [
		// 			this.modelTable.tableArn
		// 		],
		// 	}),
		// 	installLatestAwsSdk: true,
		// });

		// EXAMPLE ENTRY | IMAGE
		new cr.AwsCustomResource(this, "exampleEntryImage", {
			onCreate: {
				service: "DynamoDB",
				action: "putItem",
				parameters: {
					TableName: this.modelTable.tableName,
					Item: require("./defaults/image.stabilityai-stablediffusion.ddb.json"),
				},
				physicalResourceId: cr.PhysicalResourceId.of("exampleEntryImage"),
			},
			policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
				resources: [this.modelTable.tableArn],
			}),
			installLatestAwsSdk: true,
		});

		// https://github.com/aws/aws-cdk/issues/30067
		// // EXAMPLE ENTRY | TEXT
		// const exampleEntryImage_amazonTitan = new cr.AwsCustomResource(this, 'exampleEntryImage_amazonTitan', {
		// 	onCreate: {
		// 		service: 'DynamoDB',
		// 		action: 'putItem',
		// 		parameters: {
		// 			TableName: this.modelTable.tableName,
		// 			Item: require('./defaults/image.amazon-titan.ddb.json'),
		// 		},
		// 		physicalResourceId: cr.PhysicalResourceId.of('exampleEntryImage_amazonTitan'),
		// 	},
		// 	policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
		// 		resources: [
		// 			this.modelTable.tableArn
		// 		],
		// 	}),
		// 	installLatestAwsSdk: true,
		// });

		// EXAMPLE ENTRY | CUSTOM RESOURCE CDK LAMBDA
		NagSuppressions.addResourceSuppressionsByPath(
			cdk.Stack.of(this),
			`/${
				cdk.Stack.of(this).node.findChild("AWS679f53fac002430cb0da5b7982bd2287")
					.node.path
			}/ServiceRole/Resource`,
			[
				{
					id: "AwsSolutions-IAM4",
					appliesTo: [
						"Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
					],
					reason: "Custom Resource Lambda defined by CDK project",
				},
			],
			true,
		);

		// END
	}
}
