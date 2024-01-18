// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export function formatJobNameId(name, id) {
    return (
        <>
            <span>{name}</span>
            <br/>
            <span className="jobId">{id}</span>
        </>
    );
}