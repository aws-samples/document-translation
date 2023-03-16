// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NagSuppressions } from "cdk-nag";

import { aws_s3 as s3 } from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";

import { dt_api } from "./features/dt_api";
import { dt_web } from "./features/dt_web";
import { dt_translate } from "./features/dt_translation";

// STATIC VARS
const s3PrefixPrivate = "private";

export class DocTranStack extends cdk.Stack {
	// OUTPUTS
	public readonly appStackId: cdk.CfnOutput;
	public readonly appStackName: cdk.CfnOutput;
	public readonly awsAppsyncSchema: cdk.CfnOutput;
	public readonly appWebsiteDistribution: cdk.CfnOutput;

	// OUTPUTS | WEBSITE FRONT-END
	// OUTPUTS | WEBSITE FRONT-END | React
	// public readonly awsAppsyncSchema: cdk.CfnOutput;
	public readonly awsRegion: cdk.CfnOutput;
	public readonly awsAppsyncId: cdk.CfnOutput;
	public readonly awsAppsyncGraphqlEndpoint: cdk.CfnOutput;
	public readonly awsCognitoIdentityPoolId: cdk.CfnOutput;
	public readonly awsUserPoolsId: cdk.CfnOutput;
	public readonly awsUserPoolsWebClientId: cdk.CfnOutput;
	public readonly awsCognitoOauthDomain: cdk.CfnOutput;
	public readonly awsUserFilesS3Bucket: cdk.CfnOutput;
	public readonly awsCognitoOauthRedirect: cdk.CfnOutput;
	// OUTPUTS | WEBSITE FRONT-END | User
	public readonly appWebsiteS3Bucket: cdk.CfnOutput;
	public readonly appHostedUrl: cdk.CfnOutput;
	// OUTPUTS | SAML PROVIDER
	public readonly samlIdentifier: cdk.CfnOutput;
	public readonly samlReplyUrl: cdk.CfnOutput;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		// ENVIRONMENT VARIABLES
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
		// Web UI
		const webUi: boolean =
			process.env.webUi && process.env.webUi.toLowerCase() === "true"
				? true
				: false;
		const webUiCustomDomainFlag: boolean =
			process.env.webUiCustomDomain !== undefined && process.env.webUiCustomDomain !== "" 
				? true
				: false;
		const webUiCustomDomain: string =
			process.env.webUiCustomDomain !== undefined && process.env.webUiCustomDomain !== "" 
				? process.env.webUiCustomDomain.toLowerCase()
				: "";
		const webUiCustomDomainCertificate: string =
			process.env.webUiCustomDomainCertificate !== undefined && process.env.webUiCustomDomainCertificate !== "" 
				? process.env.webUiCustomDomainCertificate
				: "";
		// ENVIRONMENT VARIABLES | REMOVAL POLICY
		const appRemovalPolicy: string =
			process.env.appRemovalPolicy !== undefined
				? process.env.appRemovalPolicy.toLowerCase()
				: "";
		let removalPolicy: cdk.RemovalPolicy;
		switch (appRemovalPolicy) {
			case "destroy":
				removalPolicy = cdk.RemovalPolicy.DESTROY;
				break;
			case "snapshot":
				removalPolicy = cdk.RemovalPolicy.SNAPSHOT;
				break;
			default:
				removalPolicy = cdk.RemovalPolicy.RETAIN;
		}

		// S3 LOGS (Required feature)
		const serverAccessLoggingBucket = new s3.Bucket(
			this,
			"serverAccessLoggingBucket",
			{
				blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // ASM-S2
				encryption: s3.BucketEncryption.S3_MANAGED, // ASM-S3
				enforceSSL: true, // ASM-S10
				versioned: true,
				removalPolicy: removalPolicy, // ASM-CFN1
			}
		);
		NagSuppressions.addResourceSuppressions(
			serverAccessLoggingBucket,
			[
				{
					id: "AwsSolutions-S1",
					reason:
						"This bucket is the AccessLogs destination bucket for other buckets.",
				},
			],
			true
		);

		//
		// API (Required feature)
		//
		const base_api = new dt_api(this, "base_api", {
			cognitoLocalUsers,
			cognitoLocalUsersMfa,
			cognitoLocalUsersMfaOtp,
			cognitoLocalUsersMfaSms,
			cognitoSamlUsers,
			cognitoSamlMetadataUrl,
			removalPolicy: removalPolicy, // ASM-CFN1
		});

		// OUTPUTS
		this.samlReplyUrl = new cdk.CfnOutput(this, "samlReplyUrl", {
			value: `https://${base_api.userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com/saml2/idpresponse`,
		});
		this.samlIdentifier = new cdk.CfnOutput(this, "samlIdentifier", {
			value: `urn:amazon:cognito:sp:${base_api.userPool.userPoolId}`,
		});
		this.awsUserPoolsWebClientId = new cdk.CfnOutput(
			this,
			"awsUserPoolsWebClientId",
			{ value: base_api.userPoolClient.userPoolClientId }
		);
		this.awsUserPoolsId = new cdk.CfnOutput(this, "awsUserPoolsId", {
			value: base_api.userPool.userPoolId,
		});
		this.awsCognitoOauthDomain = new cdk.CfnOutput(
			this,
			"awsCognitoOauthDomain",
			{ value: base_api.userPoolDomain.domainName }
		);
		this.awsCognitoIdentityPoolId = new cdk.CfnOutput(
			this,
			"awsCognitoIdentityPoolId",
			{ value: base_api.identityPool.identityPoolId }
		);
		this.awsAppsyncId = new cdk.CfnOutput(this, "awsAppsyncId", {
			value: base_api.api.apiId,
		});
		this.awsAppsyncGraphqlEndpoint = new cdk.CfnOutput(
			this,
			"awsAppsyncGraphqlEndpoint",
			{ value: base_api.api.graphqlUrl }
		);

		//
		// TRANSLATE (Optional feature)
		//
		if (translation) {
			const translationLifecycleDefault: number =
				process.env.translationLifecycleDefault &&
				parseInt(process.env.translationLifecycleDefault) >= 1 &&
				parseInt(process.env.translationLifecycleDefault) <= 2147483647
					? parseInt(process.env.translationLifecycleDefault)
					: 7;
			const translationLifecyclePii: number =
				process.env.translationLifecyclePii &&
				parseInt(process.env.translationLifecyclePii) >= 1 &&
				parseInt(process.env.translationLifecyclePii) <= 2147483647
					? parseInt(process.env.translationLifecyclePii)
					: 3;

			const base_translate = new dt_translate(this, "base_translate", {
				serverAccessLoggingBucket,
				contentLifecycleDefault: translationLifecycleDefault,
				contentLifecyclePii: translationLifecyclePii,
				s3PrefixPrivate,
				identityPool: base_api.identityPool,
				api: base_api.api,
				removalPolicy: removalPolicy, // ASM-CFN1
				translationPii,
			});
			// OUTPUTS
			this.awsUserFilesS3Bucket = new cdk.CfnOutput(
				this,
				"awsUserFilesS3Bucket",
				{ value: base_translate.contentBucket.bucketName }
			);
		}

		//
		// WEBSITE (Optional feature)
		//
		if (webUi) {
			const base_web = new dt_web(this, "base_web", {
				serverAccessLoggingBucket,
				userPoolClient: base_api.userPoolClient,
				removalPolicy: removalPolicy, // ASM-CFN1
				webUiCustomDomainFlag: webUiCustomDomainFlag,
				webUiCustomDomain: webUiCustomDomain,
				webUiCustomDomainCertificate: webUiCustomDomainCertificate,
			});
			// OUTPUTS
			this.awsCognitoOauthRedirect = new cdk.CfnOutput(
				this,
				"awsCognitoOauthRedirect",
				{ value: `https://${base_web.websiteDistribution.domainName}/` }
			);
			this.appWebsiteS3Bucket = new cdk.CfnOutput(this, "appWebsiteS3Bucket", {
				value: base_web.websiteBucket.bucketName,
			});
			this.appWebsiteDistribution = new cdk.CfnOutput(
				this,
				"appWebsiteDistribution",
				{ value: base_web.websiteDistribution.distributionId }
			);
			if (webUiCustomDomainFlag) {
				this.appHostedUrl = new cdk.CfnOutput(this, "appHostedUrl", {
					value: `https://${webUiCustomDomain}/`,
				});
			} else {
				this.appHostedUrl = new cdk.CfnOutput(this, "appHostedUrl", {
					value: `https://${base_web.websiteDistribution.domainName}/`,
				});
			}
		}

		// OUTPUTS
		this.awsRegion = new cdk.CfnOutput(this, "awsRegion", {
			value: this.region,
		});
		this.appStackName = new cdk.CfnOutput(this, "appStackName", {
			value: this.stackName,
		});
		this.appStackId = new cdk.CfnOutput(this, "appStackId", {
			value: this.stackId,
		});
		// Must come after all components due to resolve
		this.awsAppsyncSchema = new cdk.CfnOutput(this, "awsAppsyncSchema", {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			value: this.resolve(
				(base_api.api.schema as unknown as { schema: appsync.Schema }).schema
					.definition
			),
		});
		// END
	}
}
