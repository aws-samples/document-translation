// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const cfnOutputs = require("../cfnOutputs.json");

const awsmobile = {
    // Cognito
    aws_cognito_region: cfnOutputs.awsRegion,
    aws_user_pools_id: cfnOutputs.awsUserPoolsId,
    aws_user_pools_web_client_id: cfnOutputs.awsUserPoolsWebClientId,
    aws_cognito_identity_pool_id: cfnOutputs.awsCognitoIdentityPoolId,
    oauth: {
        domain: cfnOutputs.awsCognitoOauthDomain + '.auth.' + cfnOutputs.awsRegion + '.amazoncognito.com',
        redirectSignIn: cfnOutputs.awsCognitoOauthRedirectSignIn,
        redirectSignOut: cfnOutputs.awsCognitoOauthRedirectSignOut,
        scope: ['openid'],
        responseType: 'code'
    },
    // S3
    aws_user_files_s3_bucket_region: cfnOutputs.awsRegion,
    aws_user_files_s3_bucket: cfnOutputs.awsUserFilesS3Bucket,
    // AppSync
    aws_appsync_graphqlEndpoint: cfnOutputs.awsAppsyncGraphqlEndpoint
};

export default awsmobile;