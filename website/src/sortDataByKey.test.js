// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import testFunction from './sortDataByCreatedAt';

describe("sortDataByCreatedAt", function () {
    const data = [
        { id: 1, createdAt: new Date("2022-01-01") },
        { id: 2, createdAt: new Date("2022-01-01") },
        { id: 3, createdAt: new Date("2023-03-01") },
        { id: 4, createdAt: new Date("2022-02-01") }
    ];
    
    const successData = [
        { id: 3, createdAt: new Date("2023-03-01") },
        { id: 4, createdAt: new Date("2022-02-01") },
        { id: 1, createdAt: new Date("2022-01-01") },
        { id: 2, createdAt: new Date("2022-01-01") }
    ];

    it('test success', () => {
        expect(testFunction(data)).toEqual(successData)
    });
});

