// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_iam as iam,
	aws_stepfunctions as sfn,
	aws_s3 as s3,
} from "aws-cdk-lib";

import * as dt_enums from "./enum";
import { dt_stepfunction } from "../../components/stepfunction";
import { dt_lambda } from "../../components/lambda";

import { dt_readableWorkflow as dt_readableWorkflow_amazon_titanImage } from "./vendor/image.amazon.titan-image-generator-v1";
import { dt_readableWorkflow as dt_readableWorkflow_amazon_titanText } from "./vendor/text.amazon.titan-text-*-v1";
import { dt_readableWorkflow as dt_readableWorkflow_anthropic_claudeText } from "./vendor/text.anthropic.claude-v2";
import { dt_readableWorkflow as dt_readableWorkflow_anthropic_claude3Text } from "./vendor/text.anthropic.claude-3-*-*-v1";
import { dt_readableWorkflow as dt_readableWorkflow_stabilityai_stableDiffusion } from "./vendor/image.stability.stable-diffusion-xl-v1";

export interface props {
	bedrockRegion: string;
	contentBucket: s3.Bucket;
	removalPolicy: cdk.RemovalPolicy;
}

export class dt_readableWorkflowGenerate extends Construct {
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// LAMBDA
		// LAMBDA | CONVERSE BEDROCK
		// LAMBDA | CONVERSE BEDROCK | ROLE
		const converseBedrockLambdaRole = new iam.Role(
			this,
			"converseBedrockLambdaRole",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Invoke Bedrock API)",
			},
		);

		// LAMBDA | CONVERSE BEDROCK | POLICY
		const permitConverseBedrockModel = new iam.Policy(
			this,
			"permitSfnSendSuccess",
			{
				policyName: "Send-Sfn-task-success-to-Sfn-Service",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["bedrock:InvokeModel"],
						resources: [
							`arn:aws:bedrock:${props.bedrockRegion}::foundation-model/*`, // Foundational Models
							`arn:aws:bedrock:${props.bedrockRegion}:${
								cdk.Stack.of(this).account
							}:custom-model/*`,
						],
					}),
				],
			},
		);
		converseBedrockLambdaRole.attachInlinePolicy(permitConverseBedrockModel);
		NagSuppressions.addResourceSuppressions(
			permitConverseBedrockModel,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Preferred model for prompt is unknown at deploy time",
					appliesTo: [
						`Resource::arn:aws:bedrock:${props.bedrockRegion}::foundation-model/*`,
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason: "User provided model for prompt is unknown at deploy time",
					appliesTo: [
						`Resource::arn:aws:bedrock:${props.bedrockRegion}:<AWS::AccountId>:custom-model/*`,
					],
				},
			],
			true,
		);

		// LAMBDA | CONVERSE BEDROCK | FUNCTION
		const converseBedrockLambda = new dt_lambda(this, "converseBedrockLambda", {
			role: converseBedrockLambdaRole,
			path: "lambda/converseBedrock",
			description: "Invoke Bedrock API",
			environment: {
				BEDROCK_REGION: props.bedrockRegion,
			},
			bundlingNodeModules: ["@aws-sdk/client-bedrock-runtime"],
			timeout: cdk.Duration.seconds(60),
		});

		//
		// MODEL WORKFLOWS
		// MODEL WORKFLOWS | CHOICE
		const modelChoice = new sfn.Choice(this, "modelChoice");
		// MODEL CHOICE | UNRECOGNISED
		// const updateDbUnrecognisedModel = new tasks.LambdaInvoke(
		// 	this,
		// 	"updateDbUnrecognisedModel",
		// 	{
		// 		lambdaFunction: updateDbLambda.lambdaFunction,
		// 		resultSelector: {
		// 			"Payload.$": "$.Payload",
		// 		},
		// 		resultPath: "$.updateDbUnrecognisedModel",
		// 		payload: sfn.TaskInput.fromObject({
		// 			id: sfn.JsonPath.objectAt("$.jobDetails.id"),
		// 			itemId: sfn.JsonPath.objectAt("$.jobDetails.itemId"),
		// 			status: dt_enums.ItemStatus.FAILED_UNRECOGNISEDMODEL,
		// 		}),
		// 	},
		// );
		const failUnrecognisedModel = new sfn.Fail(this, "failUnrecognisedModel", {
			error: dt_enums.ItemStatus.FAILED_UNRECOGNISEDMODEL,
			causePath: sfn.JsonPath.format(
				"Workflow does not recognise modelId of '{}'",
				sfn.JsonPath.stringAt("$.jobDetails.modelId"),
			),
		});

		// MODEL WORKFLOWS | TEXT | AMAZON
		const workflow_amazon_text = new dt_readableWorkflow_amazon_titanText(
			this,
			"workflow_amazon_text",
			{
				converseBedrockLambda: converseBedrockLambda.lambdaFunction,
				removalPolicy: props.removalPolicy,
			},
		);
		// MODEL WORKFLOWS | IMAGE | AMAZON
		const workflow_amazon_image = new dt_readableWorkflow_amazon_titanImage(
			this,
			"workflow_amazon_image",
			{
				bedrockRegion: props.bedrockRegion,
				contentBucket: props.contentBucket,
				removalPolicy: props.removalPolicy,
			},
		);
		// MODEL WORKFLOWS | TEXT | ANTHRHOPIC
		// MODEL WORKFLOWS | TEXT | ANTHRHOPIC | CLAUDE v2
		const workflow_anthropic = new dt_readableWorkflow_anthropic_claudeText(
			this,
			"workflow_anthropic",
			{
				converseBedrockLambda: converseBedrockLambda.lambdaFunction,
				removalPolicy: props.removalPolicy,
			},
		);
		// MODEL WORKFLOWS | TEXT | ANTHRHOPIC | CLAUDE 3 SONNET HAIKU
		const workflow_anthropic3 = new dt_readableWorkflow_anthropic_claude3Text(
			this,
			"workflow_anthropic3",
			{
				converseBedrockLambda: converseBedrockLambda.lambdaFunction,
				removalPolicy: props.removalPolicy,
			},
		);
		// MODEL WORKFLOWS | IMAGE | STABILITYAI
		const workflow_stabilityai =
			new dt_readableWorkflow_stabilityai_stableDiffusion(
				this,
				"workflow_stabilityai",
				{
					bedrockRegion: props.bedrockRegion,
					contentBucket: props.contentBucket,
					removalPolicy: props.removalPolicy,
				},
			);

		//
		// STATE MACHINE
		// STATE MACHINE | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_ReadableGenerate`,
			{
				nameSuffix: "ReadableGenerate",
				removalPolicy: props.removalPolicy,
				definition: modelChoice
					.when(
						workflow_amazon_text.modelChoiceCondition,
						workflow_amazon_text.invokeModel,
					)
					.when(
						workflow_amazon_image.modelChoiceCondition,
						workflow_amazon_image.invokeModel,
					)
					.when(
						workflow_anthropic.modelChoiceCondition,
						workflow_anthropic.invokeModel,
					)
					.when(
						workflow_anthropic3.modelChoiceCondition,
						workflow_anthropic3.invokeModel,
					)
					.when(
						workflow_stabilityai.modelChoiceCondition,
						workflow_stabilityai.invokeModel,
					)
					.otherwise(failUnrecognisedModel),
			},
		).StateMachine;

		NagSuppressions.addResourceSuppressions(
			this.sfnMain,
			[
				{
					id: "AwsSolutions-IAM5",
					reason:
						"Permission scoped to project specific resources. Execution ID unknown at deploy time.",
					appliesTo: [
						`Resource::arn:<AWS::Partition>:states:<AWS::Region>:<AWS::AccountId>:execution:{"Fn::Select":[6,{"Fn::Split":[":",{"Ref":"${cdk.Stack.of(
							this,
						).getLogicalId(
							workflow_amazon_text.sfnMain.node.defaultChild as cdk.CfnElement,
						)}"}]}]}*`,
						`Resource::arn:<AWS::Partition>:states:<AWS::Region>:<AWS::AccountId>:execution:{"Fn::Select":[6,{"Fn::Split":[":",{"Ref":"${cdk.Stack.of(
							this,
						).getLogicalId(
							workflow_amazon_image.sfnMain.node.defaultChild as cdk.CfnElement,
						)}"}]}]}*`,
						`Resource::arn:<AWS::Partition>:states:<AWS::Region>:<AWS::AccountId>:execution:{"Fn::Select":[6,{"Fn::Split":[":",{"Ref":"${cdk.Stack.of(
							this,
						).getLogicalId(
							workflow_anthropic.sfnMain.node.defaultChild as cdk.CfnElement,
						)}"}]}]}*`,
						`Resource::arn:<AWS::Partition>:states:<AWS::Region>:<AWS::AccountId>:execution:{"Fn::Select":[6,{"Fn::Split":[":",{"Ref":"${cdk.Stack.of(
							this,
						).getLogicalId(
							workflow_anthropic3.sfnMain.node.defaultChild as cdk.CfnElement,
						)}"}]}]}*`,
						`Resource::arn:<AWS::Partition>:states:<AWS::Region>:<AWS::AccountId>:execution:{"Fn::Select":[6,{"Fn::Split":[":",{"Ref":"${cdk.Stack.of(
							this,
						).getLogicalId(
							workflow_stabilityai.sfnMain.node.defaultChild as cdk.CfnElement,
						)}"}]}]}*`,
					],
				},
			],
			true,
		);
		// END
	}
}
