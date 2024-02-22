---
title: Web Application Firewall
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

This solution makes use of the AWS WAF for security infront of the AppSync API endpoint. The managed rule set `AWS-AWSManagedRulesCommonRuleSet` is used with the WAF. Please evaluate your security requirements against this ruleset and apply appropriate changes to the configuration should you need a different ruleset. 

- [AWSManagedRulesCommonRuleSet](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html)