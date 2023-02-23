---
layout: default
title: Features
nav_order: 2
parent: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

The solution is built with modular features in mind allowing you to enable or disable particular features that you need. The below shows the features available. 

| Feature             | Depends On  | Required  | Description                                                                 |
| ------------------- | ----------- | --------- | --------------------------------------------------------------------------- |
| Web UI              | -           | Optional  | A web UI for interacting with the solution                                  |
| Translation         | -           | Optional  | Performs translation of uploaded documents                                  |
| Translation PII     | Translation | Optional  | Performs Pii detection on uploaded files for more strict lifecycle policies |
| Cognito Local Users | -           | Optional* | Provides user authentication with local Cognito users                       |
| Cognito SAML Users  | -           | Optional* | Provides user authentication with a SAML provider                           |

\* At least one of "Cognito Local Users", "Cognito SAML Users" is required.