// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";
import {
	pipelines as pipelines,
	aws_codepipeline as codepipeline,
	aws_codepipeline_actions as codepipeline_actions,
	aws_s3 as s3,
	aws_iam as iam,
} from "aws-cdk-lib";
import { DocTranAppStage } from "./pipeline-app-stage";
import { getSharedConfiguration } from "./shared";
import { GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";

export class pipelineStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const {
			development,
			cognitoLocalUsers,
			cognitoLocalUsersMfa,
			cognitoLocalUsersMfaOtp,
			cognitoLocalUsersMfaSms,
			cognitoSamlUsers,
			cognitoSamlMetadataUrl,
			translation,
			translationPii,
			translationLifecycleDefault,
			translationLifecyclePii,
			readable,
			readableBedrockRegion,
			webUi,
			webUiCustomDomain,
			webUiCustomDomainCertificate,
			sourceGitRepo,
			sourceGitReleaseBranch,
			sourceGitUseRepoHook,
			instanceName,
			appRemovalPolicy,
			pipelineRemovalPolicy,
		} = getSharedConfiguration();

		let removalPolicy: cdk.RemovalPolicy;
		switch (pipelineRemovalPolicy) {
			case "destroy":
				removalPolicy = cdk.RemovalPolicy.DESTROY;
				break;
			case "snapshot":
				removalPolicy = cdk.RemovalPolicy.SNAPSHOT;
				break;
			default:
				removalPolicy = cdk.RemovalPolicy.RETAIN;
		}

		// S3
		// S3 | LOGGING BUCKET
		const serverAccessLogsBucket = new s3.Bucket(
			this,
			"serverAccessLogsBucket",
			{
				objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
				blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // ASM-S2
				encryption: s3.BucketEncryption.S3_MANAGED, // ASM-S3
				enforceSSL: true, // ASM-S10
				versioned: true,
				removalPolicy: removalPolicy, // ASM-CFN1
			},
		);
		NagSuppressions.addResourceSuppressions(
			serverAccessLogsBucket,
			[
				{
					id: "AwsSolutions-S1",
					reason:
						"Bucket is the AccessLogs destination bucket for other buckets.",
				},
			],
			true,
		);

		// S3 | ARTIFACT BUCKET
		const artifactBucket = new s3.Bucket(this, "artifactBucket", {
			objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // ASM-S2
			encryption: s3.BucketEncryption.S3_MANAGED, // ASM-S3
			enforceSSL: true, // ASM-S10
			versioned: true,
			removalPolicy: removalPolicy, // ASM-CFN1
			serverAccessLogsBucket, // ASM-S1
			serverAccessLogsPrefix: "artifact-bucket/", // ASM-S1
		});

		// SOURCE
		const pipelineTrigger: GitHubTrigger = sourceGitUseRepoHook
			? GitHubTrigger.WEBHOOK
			: GitHubTrigger.POLL;
		const pipelineSource = pipelines.CodePipelineSource.gitHub(
			sourceGitRepo,
			sourceGitReleaseBranch,
			{
				actionName: `DocTran-${instanceName}-Source`,
				trigger: pipelineTrigger,
			},
		);

		// PIPELINE
		// PIPELINE | CODEPIPELINE
		const pipeline = new codepipeline.Pipeline(this, "pipeline", {
			artifactBucket,
			restartExecutionOnUpdate: true,
			crossAccountKeys: true,
			enableKeyRotation: true,
		});

		// PIPELINE | CDKPIPELINE
		const dirPipeline = "infrastructure";
		const cdkPipeline = new pipelines.CodePipeline(this, "cdkPipeline", {
			codePipeline: pipeline,
			synth: new pipelines.ShellStep("Synth", {
				input: pipelineSource,
				primaryOutputDirectory: `${dirPipeline}/cdk.out`,
				commands: [
					"npm install -g aws-cdk@^2.89.0",
					`cd ${dirPipeline}`,
					"npm ci",
					"cdk synth",
				],
			}),
			codeBuildDefaults: {
				buildEnvironment: {
					environmentVariables: {
						development: { value: development },
						sourceGitRepo: { value: sourceGitRepo },
						sourceGitReleaseBranch: {
							value: sourceGitReleaseBranch,
						},
						instanceName: { value: instanceName },
						pipelineRemovalPolicy: { value: pipelineRemovalPolicy },
						appRemovalPolicy: { value: appRemovalPolicy },
						webUi: { value: webUi },
						webUiCustomDomain: { value: webUiCustomDomain },
						webUiCustomDomainCertificate: {
							value: webUiCustomDomainCertificate,
						},
						cognitoLocalUsers: { value: cognitoLocalUsers },
						cognitoLocalUsersMfa: { value: cognitoLocalUsersMfa },
						cognitoLocalUsersMfaOtp: { value: cognitoLocalUsersMfaOtp },
						cognitoLocalUsersMfaSms: { value: cognitoLocalUsersMfaSms },
						cognitoSamlUsers: { value: cognitoSamlUsers },
						cognitoSamlMetadataUrl: { value: cognitoSamlMetadataUrl },
						readable: { value: readable },
						readableBedrockRegion: { value: readableBedrockRegion },
						translation: { value: translation },
						translationPii: { value: translationPii },
						translationLifecycleDefault: { value: translationLifecycleDefault },
						translationLifecyclePii: { value: translationLifecyclePii },
					},
				},
				rolePolicy: [
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ["cloudformation:DescribeStacks"],
						resources: ["*"],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ["cloudfront:CreateInvalidation"],
						resources: ["*"],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ["s3:PutObject", "s3:ListBucket", "s3:DeleteObject"],
						resources: ["*"],
					}),
					new iam.PolicyStatement({
						effect: iam.Effect.ALLOW,
						actions: ["appsync:GetIntrospectionSchema"],
						resources: [
							`arn:aws:appsync:${this.region}:${this.account}:/v1/apis/*/schema`,
						],
					}),
				],
			},
		});
		// PIPELINE | STAGE
		const deployStage = new DocTranAppStage(this, "DocTran-appStack", {
			stageName: `DocTran-${instanceName}-Deploy`,
			env: {
				account: this.account,
				region: this.region,
			},
		});

		const post: pipelines.ShellStep[] = [];
		if (webUi) {
			const shellStep_deployWebsiteToS3 = new pipelines.ShellStep(
				"deployWebsiteToS3",
				{
					envFromCfnOutputs: {
						appStackId: deployStage.appStackId,
						appStackName: deployStage.appStackName,
						appWebsiteS3Bucket: deployStage.appWebsiteS3Bucket,
						appWebsiteDistribution: deployStage.appWebsiteDistribution,
					},
					installCommands: ["npm install -u @aws-amplify/cli@~12.0"],
					commands: [
						// ENVs
						'echo "appStackId: ${appStackId}"',
						'echo "appStackName: ${appStackName}"',
						'echo "appWebsiteS3Bucket: ${appWebsiteS3Bucket}"',
						"export WEBDIR=${CODEBUILD_SRC_DIR}/website",
						"export WEBDIR_SRC=${WEBDIR}/src",
						"export WEBDIR_BUILD=${WEBDIR}/build",
						"export WEBDIR_GRAPHQL=${WEBDIR_SRC}/graphql",
						'echo "WEBDIR: ${WEBDIR}"',
						'echo "WEBDIR_SRC: ${WEBDIR_SRC}"',
						'echo "WEBDIR_BUILD: ${WEBDIR_BUILD}"',
						'echo "WEBDIR_GRAPHQL: ${WEBDIR_GRAPHQL}"',
						"export CFNOUTPUTSFILE=${WEBDIR_SRC}/cfnOutputs.json",
						"export GRAPHQLSCHEMAFILE=${WEBDIR_GRAPHQL}/schema.graphql",
						"export FEATURESFILE=${WEBDIR_SRC}/features.json",
						'echo "CFNOUTPUTSFILE: ${CFNOUTPUTSFILE}"',
						'echo "GRAPHQLSCHEMAFILE: ${GRAPHQLSCHEMAFILE}"',
						'echo "FEATURESFILE: ${FEATURESFILE}"',
						// Get Cloudformation Outputs
						"aws cloudformation describe-stacks --stack-name ${appStackName} --query 'Stacks[0].Outputs' | jq .[] | jq -n 'reduce inputs as $i (null; . + ($i|{ (.OutputKey) : (.OutputValue) }))' > ${CFNOUTPUTSFILE}",
						// Get AppSync Schema
						"export awsAppsyncId=$(jq -r .awsAppsyncId ${CFNOUTPUTSFILE})",
						'echo "awsAppsyncId: ${awsAppsyncId}"',
						"mkdir -p ${WEBDIR_GRAPHQL}",
						"aws appsync get-introspection-schema --api-id=${awsAppsyncId} --format SDL ${GRAPHQLSCHEMAFILE}",
						"cd ${WEBDIR_GRAPHQL}",
						"~/.amplify/bin/amplify codegen",
						// BUILD REACT
						// BUILD REACT | FEATURES
						"cd ${WEBDIR_SRC}",
						"touch ${FEATURESFILE}",
						'echo "{}" > ${FEATURESFILE}',
						'jq -r ".translation = "${translation}"" ${FEATURESFILE} > ${FEATURESFILE}.tmp && mv ${FEATURESFILE}.tmp ${FEATURESFILE}',
						'jq -r ".readable    = "${readable}""    ${FEATURESFILE} > ${FEATURESFILE}.tmp && mv ${FEATURESFILE}.tmp ${FEATURESFILE}',
						'echo "Features enabled: $(cat ${FEATURESFILE})"',
						// BUILD REACT | BUILD
						"cd ${WEBDIR}",
						"npm ci",
						"npm run build",
						// PUSH TO S3
						"cd ${WEBDIR_BUILD}",
						"aws s3 rm s3://${appWebsiteS3Bucket} --recursive",
						"aws s3 sync . s3://${appWebsiteS3Bucket}",
						'aws cloudfront create-invalidation --distribution-id ${appWebsiteDistribution} --paths "/*"',
					],
				},
			);
			post.push(shellStep_deployWebsiteToS3);
		}
		cdkPipeline.addStage(deployStage, {
			post,
		});

		// Force pipeline construct creation forward
		cdkPipeline.buildPipeline();

		// // Add approval pre-CDK
		// pipeline.addStage({
		// 	stageName: "ManualApproval_PreSynth",
		// 	placement: {
		// 		justAfter: cdkPipeline.pipeline.stages[0],
		// 	},
		// 	actions: [
		// 		new codepipeline_actions.ManualApprovalAction({
		// 			actionName: "ManualApproval_PreSynth",
		// 			externalEntityLink: `https://github.com/${sourceGitRepo}/releases`,
		// 			additionalInformation: `The source repository ${sourceGitRepo} tracked branch has been updated. Please review and approve the pipeline to implement the update if appropriate.`,
		// 		}),
		// 	],
		// });

		// CDK NAGS
		// CDK NAGS | PIPELINE
		NagSuppressions.addResourceSuppressions(
			pipeline,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources",
					appliesTo: [
						"Action::s3:GetObject*",
						"Action::s3:GetBucket*",
						"Action::s3:List*",
						"Action::s3:DeleteObject*",
						"Action::s3:Abort*",
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							artifactBucket.node.defaultChild as cdk.CfnElement,
						)}.Arn>/*`,
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources",
					appliesTo: [
						"Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/codebuild/<pipelineBuildSynthCdkBuildProject2E6D8406>:*",
						"Resource::arn:<AWS::Partition>:codebuild:<AWS::Region>:<AWS::AccountId>:report-group/<pipelineBuildSynthCdkBuildProject2E6D8406>-*",
					],
				},
				{
					id: "AwsSolutions-CB4",
					reason:
						"Encryption is enabled by default by CodePipline https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline-readme.html",
				},
				{
					id: "AwsSolutions-IAM5",
					appliesTo: ["Resource::*"],
					reason: "Resource ARN is unknown before deployment. Permit wildcard.",
				},
			],
			true,
		);

		// CDK NAGS | CDK PIPELINE
		NagSuppressions.addResourceSuppressions(
			cdkPipeline,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources",
					appliesTo: [
						"Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/codebuild/<cdkPipelineUpdatePipelineSelfMutation8E64EDB9>:*",
						"Resource::arn:<AWS::Partition>:codebuild:<AWS::Region>:<AWS::AccountId>:report-group/<cdkPipelineUpdatePipelineSelfMutation8E64EDB9>-*",
						`Resource::<${cdk.Stack.of(this).getLogicalId(
							artifactBucket.node.defaultChild as cdk.CfnElement,
						)}.Arn>/*`,
						"Action::s3:GetBucket*",
						"Action::s3:GetObject*",
						"Action::s3:List*",
					],
				},
				{
					id: "AwsSolutions-IAM5",
					reason: "Permission scoped to codebuild",
					appliesTo: ["Resource::*"],
				},
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions self mutation",
					appliesTo: ["Resource::arn:*:iam::<AWS::AccountId>:role/*"],
				},
				{
					id: "AwsSolutions-IAM5",
					reason: "Schema ID unknown at deploy/pipeline time",
					appliesTo: [
						"Resource::arn:aws:appsync:<AWS::Region>:<AWS::AccountId>:/v1/apis/*/schema",
					],
				},
				{
					id: "AwsSolutions-CB4",
					reason:
						"Encryption is enabled by default by CodePipline https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codepipeline-readme.html",
				},
			],
			true,
		);

		// CDK NAGS | PIPELINE | STAGE
		NagSuppressions.addResourceSuppressions(
			pipeline,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to dedicated resources",
				},
			],
			true,
		);

		// CDK NAGS | CDK PIPELINE | STAGE

		NagSuppressions.addResourceSuppressions(
			cdkPipeline,
			[
				{
					id: "AwsSolutions-IAM5",
					reason: "Permissions scoped to service resources",
					appliesTo: [
						"Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/codebuild/*",
						"Resource::arn:<AWS::Partition>:codebuild:<AWS::Region>:<AWS::AccountId>:report-group/*",
					],
				},
			],
			true,
		);

		// END
	}
}
