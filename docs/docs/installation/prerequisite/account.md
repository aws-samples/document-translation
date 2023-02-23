---
layout: default
title: Workload Account
parent: Prerequisite
grand_parent: Installation
nav_order: 2
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

{: .note-title }
> Recommended
>
> This step is recommended.

It is recommended to install this project workload into a dedicated AWS account separate from existing applications and infrastructure. AWS Organizations allow for the management and centralised billing of multiple AWS Accounts within an organizational structure. This recommendation follows the AWS Well Architected Framework.

- [Organizing Your AWS Environment Using Multiple Accounts](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html)
- [SEC01-BP01 Separate workloads using accounts](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_multi_accounts.html)

Please provision a dedicated AWS Account for this workload within your AWS Organization.    

- [Provision and manage accounts with Account Factory](https://docs.aws.amazon.com/controltower/latest/userguide/account-factory.html)