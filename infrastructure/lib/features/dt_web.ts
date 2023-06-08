// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";

import {
	aws_s3 as s3,
	aws_cloudfront as cloudfront,
	aws_cloudfront_origins as origins,
	aws_cognito as cognito,
	aws_certificatemanager as acm,
} from "aws-cdk-lib";

export interface props {
	serverAccessLoggingBucket: s3.Bucket;
	userPoolClient: cognito.UserPoolClient;
	removalPolicy: cdk.RemovalPolicy;
	webUiCustomDomainFlag: boolean,
	webUiCustomDomain: string,
	webUiCustomDomainCertificate: string,
	signOutSuffix: string,
}

export class dt_web extends Construct {
	public readonly websiteDistribution: cloudfront.Distribution;
	public readonly websiteBucket: s3.Bucket;

	constructor(scope: Construct, id: string, props: props) {
		super(scope, id);

		// WEBSITE
		// WEBSITE | HOSTING BUCKET
		this.websiteBucket = new s3.Bucket(this, "websiteBucket", {
			objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // ASM-S2
			encryption: s3.BucketEncryption.S3_MANAGED, // ASM-S3
			enforceSSL: true, // ASM-S10
			versioned: true,
			serverAccessLogsBucket: props.serverAccessLoggingBucket, // ASM-S1
			serverAccessLogsPrefix: "website-bucket/", // ASM-S1
			removalPolicy: props.removalPolicy, // ASM-CFN1
		});

		// WEBSITE | CLOUDFRONT
		// Redirect non index pages back to React to handle
		const returnUnknownPagesToIndex: cloudfront.ErrorResponse = {
			httpStatus: 403,
			responseHttpStatus: 200,
			responsePagePath: '/',
		};
		if (props.webUiCustomDomainFlag) {
			const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.webUiCustomDomainCertificate);
			this.websiteDistribution = new cloudfront.Distribution(
				this,
				"websiteDistribution",
				{
					domainNames: [props.webUiCustomDomain],
					certificate: certificate,
					defaultBehavior: { 
						origin: new origins.S3Origin(this.websiteBucket), // ASM-S5 // ASM-CRF6
						allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
						viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					},
					defaultRootObject: "index.html",
					enableLogging: true, // ASM-CFR3
					logBucket: props.serverAccessLoggingBucket, // ASM-S1
					logFilePrefix: "logs/websiteDistribution/", // ASM-S1
					logIncludesCookies: true,
					minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021, // ASM-CRF5
					errorResponses: [
						returnUnknownPagesToIndex,
					],
				}
			);
		} else {
			this.websiteDistribution = new cloudfront.Distribution(
				this,
				"websiteDistribution",
				{
					defaultBehavior: { 
						origin: new origins.S3Origin(this.websiteBucket), // ASM-S5 // ASM-CRF6
						allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
						viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					},
					defaultRootObject: "index.html",
					enableLogging: true, // ASM-CFR3
					logBucket: props.serverAccessLoggingBucket, // ASM-S1
					logFilePrefix: "logs/websiteDistribution/", // ASM-S1
					logIncludesCookies: true,
					minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021, // ASM-CRF5
					errorResponses: [
						returnUnknownPagesToIndex,
					],
				}
			);
		};
		NagSuppressions.addResourceSuppressions(
			this.websiteDistribution,
			[
				{
					id: "AwsSolutions-CFR1",
					reason: "Do not restrict CloudFront Geo regions",
				},
				{
					id: "AwsSolutions-CFR2",
					reason:
						"No WAF on distribution as the site is static content with no server side logic.",
				},
				{
					id: "AwsSolutions-CFR4",
					reason: "Custom certificate is not in scope for this prototype",
				},
			],
			true
		);

		// WEBSITE | API CALLBACK
		
		const cfnUserPoolClient = props.userPoolClient.node
			.defaultChild as cognito.CfnUserPoolClient;
		if (props.webUiCustomDomainFlag) {
			cfnUserPoolClient.callbackUrLs = [
				`https://${this.websiteDistribution.domainName}/`,
				`https://${props.webUiCustomDomain}/`
			];
			
			cfnUserPoolClient.logoutUrLs = [
				`https://${this.websiteDistribution.domainName}/${props.signOutSuffix}`,
				`https://${props.webUiCustomDomain}/${props.signOutSuffix}`
			];
			
		} else {
			cfnUserPoolClient.callbackUrLs = [
				`https://${this.websiteDistribution.domainName}/`,
			];
			cfnUserPoolClient.logoutUrLs = [
				`https://${this.websiteDistribution.domainName}/${props.signOutSuffix}`,
			];
		}
		// END
	}
}
