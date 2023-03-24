// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import testFunction from './loadSampleData';

describe("loadSampleData", function () {
    const successData = [
        {
            "createdAt": "1641600000",
            "jobName": "Sample processing.docx",
            "jobStatus": "PROCESSING",
            "languageSource": "en",
            "languageTargets": "[\"el\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1641513600",
            "jobName": "Sample completed.docx",
            "jobStatus": "COMPLETED",
            "languageSource": "en",
            "languageTargets": "[\"es-MX\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1641427200",
            "jobName": "Sample multiple.docx",
            "jobStatus": "COMPLETED",
            "languageSource": "en",
            "languageTargets": "[\"de\", \"gu\", \"pl\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1641340800",
            "jobName": "Sample bulk.docx",
            "jobStatus": "COMPLETED",
            "languageSource": "en",
            "languageTargets": "[\"af\", \"sq\", \"am\", \"ar\", \"hy\", \"az\", \"bn\", \"bs\", \"bg\", \"ca\", \"zh\", \"zh-TW\", \"hr\", \"cs\", \"da\", \"fa-AF\", \"nl\", \"et\", \"fa\", \"tl\", \"fi\", \"fr\", \"fr-CA\", \"ka\", \"de\", \"el\", \"gu\", \"ht\", \"ha\", \"he\", \"hi\", \"hu\", \"is\", \"id\", \"ga\", \"it\", \"ja\", \"kn\", \"kk\", \"ko\", \"lv\", \"lt\", \"mk\", \"ms\", \"ml\", \"mt\", \"mr\", \"mn\", \"no\", \"ps\", \"pl\", \"pt\", \"pt-PT\", \"pa\", \"ro\", \"ru\", \"sr\", \"si\", \"sk\", \"sl\", \"so\", \"es\", \"es-MX\", \"sw\", \"sv\", \"ta\", \"te\", \"th\", \"tr\", \"uk\", \"ur\", \"uz\", \"vi\", \"cy\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1641254400",
            "jobName": "Sample expired.docx",
            "jobStatus": "EXPIRED",
            "languageSource": "en",
            "languageTargets": "[\"uz\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1641168000",
            "jobName": "Sample aborted.docx",
            "jobStatus": "ABORTED",
            "languageSource": "en",
            "languageTargets": "[\"sv\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1641081600",
            "jobName": "Sample failed.docx",
            "jobStatus": "FAILED",
            "languageSource": "en",
            "languageTargets": "[\"fr\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        },
        {
            "createdAt": "1640995200",
            "jobName": "Sample timed out.docx",
            "jobStatus": "TIMED_OUT",
            "languageSource": "en",
            "languageTargets": "[\"el\"]",
            "id": "sample",
            "jobOwner": "sample",
            "translateKey": "{\"sample\":\"sample\"}"
        }
    ]

    it('test success', async () => {
        expect(await testFunction()).toEqual(successData)
    });
});

