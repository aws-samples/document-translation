// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";
import {
	pipelines as pipelines,
	aws_codepipeline as codepipeline,
	aws_s3 as s3,
	aws_iam as iam,
	aws_codecommit as codecommit,
} from "aws-cdk-lib";
import { DocTranAppStage } from "./pipeline-app-stage";

export class pipelineStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		// ENVIRONMENT VARIABLES
		// ENVIRONMENT VARIABLES | DEVELOPMENT
		const development: boolean =
			process.env.development &&
			process.env.development.toLowerCase() === "true"
				? true
				: false;
		// ENVIRONMENT VARIABLES | FEATURES (Default: false)
		// Cognito local users
		const cognitoLocalUsers: boolean =
			process.env.cognitoLocalUsers &&
			process.env.cognitoLocalUsers.toLowerCase() === "true"
				? true
				: false;
		const cognitoLocalUsersMfa: string =
			process.env.cognitoLocalUsersMfa !== undefined
				? process.env.cognitoLocalUsersMfa.toLowerCase()
				: "off";
		const cognitoLocalUsersMfaOtp: boolean =
			process.env.cognitoLocalUsersMfaOtp &&
			process.env.cognitoLocalUsersMfaOtp.toLowerCase() === "true"
				? true
				: false;
		const cognitoLocalUsersMfaSms: boolean =
			process.env.cognitoLocalUsersMfaSms &&
			process.env.cognitoLocalUsersMfaSms.toLowerCase() === "true"
				? true
				: false;
		// Cognito SAML users
		const cognitoSamlUsers: boolean =
			process.env.cognitoSamlUsers &&
			process.env.cognitoSamlUsers.toLowerCase() === "true"
				? true
				: false;
		const cognitoSamlMetadataUrl: string =
			process.env.cognitoSamlMetadataUrl !== undefined
				? process.env.cognitoSamlMetadataUrl
				: "";
		// Translation
		const translation: boolean =
			process.env.translation &&
			process.env.translation.toLowerCase() === "true"
				? true
				: false;
		const translationPii: boolean =
			process.env.translationPii &&
			process.env.translationPii.toLowerCase() === "true"
				? true
				: false;
		const translationLifecycleDefault: number =
			process.env.translationLifecycleDefault &&
			parseInt(process.env.translationLifecycleDefault) > 0
				? parseInt(process.env.translationLifecycleDefault)
				: 7;
		const translationLifecyclePii: number =
			process.env.translationLifecyclePii &&
			parseInt(process.env.translationLifecyclePii) > 0
				? parseInt(process.env.translationLifecyclePii)
				: 3;
		// Readable
		const readable: boolean =
			process.env.readable && process.env.readable.toLowerCase() === "true"
				? true
				: false;
		// Web UI
		const webUi: boolean =
			process.env.webUi && process.env.webUi.toLowerCase() === "true"
				? true
				: false;
		const webUiCustomDomain: string =
			process.env.webUiCustomDomain !== undefined &&
			process.env.webUiCustomDomain !== ""
				? process.env.webUiCustomDomain.toLowerCase()
				: "";
		const webUiCustomDomainCertificate: string =
			process.env.webUiCustomDomainCertificate !== undefined &&
			process.env.webUiCustomDomainCertificate !== ""
				? process.env.webUiCustomDomainCertificate
				: "";
		// ENVIRONMENT VARIABLES | GIT
		// ENVIRONMENT VARIABLES | GIT | SERVICE
		const sourceGitService: string =
			process.env.sourceGitService !== undefined
				? process.env.sourceGitService.toLowerCase()
				: "";
		// ENVIRONMENT VARIABLES | GIT | REPO
		const sourceGitRepo: string =
			process.env.sourceGitRepo !== undefined ? process.env.sourceGitRepo : "";
		if (sourceGitRepo === "") {
			throw new Error("sourceGitRepo is required");
		}
		// ENVIRONMENT VARIABLES | GIT | BRANCH
		const sourceGitBranch: string =
			process.env.sourceGitBranch !== undefined
				? process.env.sourceGitBranch
				: "main";
		// ENVIRONMENT VARIABLES | REMOVAL POLICY
		// ENVIRONMENT VARIABLES | REMOVAL POLICY | APP
		const appRemovalPolicy: string =
			process.env.appRemovalPolicy !== undefined
				? process.env.appRemovalPolicy
				: "";
		// ENVIRONMENT VARIABLES | REMOVAL POLICY | PIPELINE
		const pipelineRemovalPolicy: string =
			process.env.pipelineRemovalPolicy !== undefined
				? process.env.pipelineRemovalPolicy.toLowerCase()
				: "";
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
		let pipelineSource: pipelines.CodePipelineSource;
		if (sourceGitService == "github") {
			pipelineSource = pipelines.CodePipelineSource.gitHub(
				sourceGitRepo,
				sourceGitBranch,
			);
		} else {
			const codeCommitRepo = codecommit.Repository.fromRepositoryName(
				this,
				"codeCommitRepo",
				sourceGitRepo,
			);
			pipelineSource = pipelines.CodePipelineSource.codeCommit(
				codeCommitRepo,
				sourceGitBranch,
			);
		}

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
					"npm run build lib/**.ts",
					"cdk synth",
				],
			}),
			codeBuildDefaults: {
				buildEnvironment: {
					environmentVariables: {
						development: { value: development },
						sourceGitService: { value: sourceGitService },
						sourceGitRepo: { value: sourceGitRepo },
						sourceGitBranch: { value: sourceGitBranch },
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
						'export WEBDIR=${CODEBUILD_SRC_DIR}/website',
						'export WEBDIR_SRC=${WEBDIR}/src',
						'export WEBDIR_BUILD=${WEBDIR}/build',
						'export WEBDIR_GRAPHQL=${WEBDIR_SRC}/graphql',
						'echo "WEBDIR: ${WEBDIR}"',
						'echo "WEBDIR_SRC: ${WEBDIR_SRC}"',
						'echo "WEBDIR_BUILD: ${WEBDIR_BUILD}"',
						'echo "WEBDIR_GRAPHQL: ${WEBDIR_GRAPHQL}"',
						'export CFNOUTPUTSFILE=${WEBDIR_SRC}/cfnOutputs.json',
						'export GRAPHQLSCHEMAFILE=${WEBDIR_GRAPHQL}/schema.graphql',
						'export FEATURESFILE=${WEBDIR_SRC}/features.json',
						'echo "CFNOUTPUTSFILE: ${CFNOUTPUTSFILE}"',
						'echo "GRAPHQLSCHEMAFILE: ${GRAPHQLSCHEMAFILE}"',
						'echo "FEATURESFILE: ${FEATURESFILE}"',
						// Get Cloudformation Outputs
						"aws cloudformation describe-stacks --stack-name ${appStackName} --query 'Stacks[0].Outputs' | jq .[] | jq -n 'reduce inputs as $i (null; . + ($i|{ (.OutputKey) : (.OutputValue) }))' > ${CFNOUTPUTSFILE}",
						// Get AppSync Schema
						'export awsAppsyncId=$(jq -r .awsAppsyncId ${CFNOUTPUTSFILE})',
						'echo "awsAppsyncId: ${awsAppsyncId}"',
						'mkdir -p ${WEBDIR_GRAPHQL}',
						'aws appsync get-introspection-schema --api-id=${awsAppsyncId} --format SDL ${GRAPHQLSCHEMAFILE}',
						'cd ${WEBDIR_GRAPHQL}',
						'~/.amplify/bin/amplify codegen',
						// BUILD REACT
						// BUILD REACT | FEATURES
						'cd ${WEBDIR_SRC}',
						'touch ${FEATURESFILE}',
						'echo "{}" > ${FEATURESFILE}',
						'jq -r ".translation = \"${translation}\"" ${FEATURESFILE} > ${FEATURESFILE}.tmp && mv ${FEATURESFILE}.tmp ${FEATURESFILE}',
						'jq -r ".readable    = \"${readable}\""    ${FEATURESFILE} > ${FEATURESFILE}.tmp && mv ${FEATURESFILE}.tmp ${FEATURESFILE}',
						// BUILD REACT | BUILD
						'cd ${WEBDIR}',
						'npm ci',
						'npm run build',
						// PUSH TO S3
						'cd ${WEBDIR_BUILD}',
						'aws s3 rm s3://${appWebsiteS3Bucket} --recursive',
						'aws s3 sync . s3://${appWebsiteS3Bucket}',
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
