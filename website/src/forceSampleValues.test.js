// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import testFunction from './forceSampleValues';

describe("forceSampleValues", function () {
    const data = [
        {
            "createdAt": "1641600000",
            "jobName": "Sample processing.docx",
            "jobStatus": "PROCESSING",
            "languageSource": "en",
            "languageTargets": "[\"el\"]"
        },
        {
            "id": "foobar",
            "createdAt": "1641340800",
            "jobName": "Sample bulk.docx",
            "jobStatus": "COMPLETED",
            "languageSource": "en",
            "languageTargets": "[\"af\", \"sq\", \"am\"]"
        }
    ]
    const successData = [
        {
            "createdAt": "1641600000",
            "id": "sample",
            "jobName": "Sample processing.docx",
            "jobOwner": "sample",
            "jobStatus": "PROCESSING",
            "languageSource": "en",
            "languageTargets": "[\"el\"]",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1641340800",
            "id": "sample",
            "jobName": "Sample bulk.docx",
            "jobOwner": "sample",
            "jobStatus": "COMPLETED",
            "languageSource": "en",
            "languageTargets": "[\"af\", \"sq\", \"am\"]",
            "translateKey": "{\"sample\":\"sample\"}"
        }
    ]

    it('test success', () => {
        expect(testFunction(data)).toEqual(successData)
    });
});

