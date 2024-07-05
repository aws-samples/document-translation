// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_stepfunctions as sfn,
	aws_stepfunctions_tasks as tasks,
	aws_iam as iam,
	aws_s3 as s3,
} from "aws-cdk-lib";

import { Bucket } from "../enum";
import { dt_lambda } from "../../../components/lambda";
import { dt_stepfunction } from "../../../components/stepfunction";

export interface props {
	bedrockRegion: string;
	contentBucket: s3.Bucket;
	removalPolicy: cdk.RemovalPolicy;
}

enum Strings {
	modelVendor = "amazon",
	modelType = "image",
	modelNamePrefix = "titan-image-",
}

export class dt_readableWorkflow extends Construct {
	public readonly invokeModel: tasks.StepFunctionsStartExecution;
	public readonly modelChoiceCondition: sfn.Condition;
	public readonly sfnMain: sfn.StateMachine;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// LAMBDA
		// LAMBDA | INVOKE BEDROCK
		// LAMBDA | INVOKE BEDROCK | ROLE
		const invokeBedrockLambdaRole = new iam.Role(
			this,
			"invokeBedrockSaveToS3",
			{
				// ASM-L6 // ASM-L8
				assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
				description: "Lambda Role (Invoke Bedrock API & save file to S3)",
			},
		);

		// LAMBDA | INVOKE BEDROCK | POLICY
		const permitInvokeBedrockModel = new iam.Policy(
			this,
			"permitSfnSendSuccess",
			{
				policyName: "Send-Sfn-task-success-to-Sfn-Service",
				statements: [
					new iam.PolicyStatement({
						// ASM-IAM
						actions: ["bedrock:InvokeModel"],
						resources: [
							`arn:aws:bedrock:${props.bedrockRegion}::foundation-model/${Strings.modelVendor}.${Strings.modelNamePrefix}*`, // Foundational Models
						],
					}),
				],
			},
		);
		invokeBedrockLambdaRole.attachInlinePolicy(permitInvokeBedrockModel);
		NagSuppressions.addResourceSuppressions(
			permitInvokeBedrockModel,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Preferred model for prompt is unknown at deploy time",
					appliesTo: [
						`Resource::arn:aws:bedrock:${props.bedrockRegion}::foundation-model/${Strings.modelVendor}.${Strings.modelNamePrefix}*`,
					],
				},
			],
			true,
		);
		const permitPutS3 = new iam.Policy(this, "permitPutS3", {
			policyName: "S3-PutObject",
			statements: [
				new iam.PolicyStatement({
					// ASM-IAM
					actions: ["s3:PutObject"],
					resources: [
						`${props.contentBucket.bucketArn}/${Bucket.PREFIX_PRIVATE}/*`,
					],
				}),
			],
		});
		invokeBedrockLambdaRole.attachInlinePolicy(permitPutS3);
		NagSuppressions.addResourceSuppressions(
			permitPutS3,
			[
				{
					id: "AwsSolutions-IAM5",
					reason:
						"Scoped to project specific resources. Unknown filenames at deploy time.",
					appliesTo: [
						"Resource::<basereadablecontentBucketbucket6155EB26.Arn>/private/*",
					],
				},
			],
			true,
		);

		// LAMBDA | INVOKE BEDROCK | FUNCTION
		const invokeBedrockLambda = new dt_lambda(this, "invokeBedrockLambda", {
			role: invokeBedrockLambdaRole,
			path: "lambda/invokeBedrockSaveToS3",
			description: "Invoke Bedrock API & save file to S3",
			environment: {
				BEDROCK_REGION: props.bedrockRegion,
			},
			bundlingNodeModules: [
				"@aws-sdk/client-bedrock-runtime",
				"@aws-sdk/client-s3",
			],
			timeout: cdk.Duration.seconds(60),
		});

		//
		// STATE MACHINE
		// STATE MACHINE | TASKS
		// STATE MACHINE | TASKS | createPrompt
		const createPrompt = new sfn.Pass(this, "createPrompt", {
			resultPath: "$.prompt",
			parameters: {
				Payload: {
					textToImageParams: {
						text: sfn.JsonPath.stringAt("$.jobDetails.prePrompt"),
					},
				},
			},
		});
		// STATE MACHINE | TASKS | createBody
		const createBody = new sfn.Pass(this, "createBody", {
			resultPath: "$.body",
			parameters: {
				Payload: sfn.JsonPath.jsonMerge(
					sfn.JsonPath.objectAt("$.prompt.Payload"),
					sfn.JsonPath.objectAt("$.jobDetails.parameters"),
				),
			},
		});

		// STATE MACHINE | TASKS | invokeBedrock
		const invokeBedrock = new tasks.LambdaInvoke(this, "invokeBedrock", {
			lambdaFunction: invokeBedrockLambda.lambdaFunction,
			resultPath: "$.invokeBedrock",
			resultSelector: {
				"Payload.$": "$.Payload",
			},
			payload: sfn.TaskInput.fromObject({
				ModelId: sfn.JsonPath.objectAt("$.jobDetails.modelId"),
				Body: sfn.JsonPath.stringAt("$.body.Payload"),
				PathToResult: "images.0",
				ResultS3Bucket: props.contentBucket.bucketName,
				ResultS3Key: sfn.JsonPath.format(
					`${Bucket.PREFIX_PRIVATE}/{}/{}/{}_{}.png`,
					sfn.JsonPath.stringAt("$.jobDetails.identity"),
					sfn.JsonPath.stringAt("$.jobDetails.id"),
					sfn.JsonPath.stringAt("$.jobDetails.itemId"),
					sfn.JsonPath.stringAt("$$.Execution.StartTime"),
				),
				ItemId: sfn.JsonPath.stringAt("$.jobDetails.itemId"),
			}),
		});

		// STATE MACHINE | TASKS | filterOutput
		const filterOutput = new sfn.Pass(this, "filterOutput", {
			parameters: {
				payload: sfn.JsonPath.stringAt("$.invokeBedrock.Payload.key"),
			},
		});

		// STATE MACHINE | DEF
		this.sfnMain = new dt_stepfunction(
			this,
			`${cdk.Stack.of(this).stackName}_Readable_${Strings.modelVendor}_${
				Strings.modelType
			}`,
			{
				nameSuffix: `Readable_${Strings.modelVendor}_${Strings.modelType}`,
				removalPolicy: props.removalPolicy,
				definition: createPrompt
					.next(createBody)
					.next(invokeBedrock)
					.next(filterOutput),
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
							invokeBedrockLambda.lambdaFunction.node
								.defaultChild as cdk.CfnElement,
						)}.Arn>:*`,
					],
				},
			],
			true,
		);

		// PARENT
		// PARENT | CHOICE FILTER
		this.modelChoiceCondition = sfn.Condition.stringMatches(
			"$.jobDetails.modelId",
			`${Strings.modelVendor}.${Strings.modelNamePrefix}*`,
		);
		// PARENT | TASK
		this.invokeModel = new tasks.StepFunctionsStartExecution(
			this,
			`invokeModel_${Strings.modelVendor}_${Strings.modelType}`,
			{
				stateMachine: this.sfnMain,
				resultSelector: {
					"Payload.$": "$.Output.payload",
				},
				resultPath: "$.invokeModel",
				integrationPattern: sfn.IntegrationPattern.RUN_JOB,
				input: sfn.TaskInput.fromObject({
					jobDetails: sfn.JsonPath.objectAt("$.jobDetails"),
				}),
			},
		);

		// END
	}
}
