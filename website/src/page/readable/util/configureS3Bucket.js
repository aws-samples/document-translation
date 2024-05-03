// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { amplifyConfigureAppend } from "../../../util/amplifyConfigure";

export async function configureS3Bucket() {
    const cfnOutputs = require("../../../cfnOutputs.json");

    const storageConfig = {
        Storage: {
            S3: {
                bucket: cfnOutputs.awsReadableS3Bucket,
                region: cfnOutputs.awsRegion,
            },
        },
    };
    amplifyConfigureAppend(storageConfig);
}
