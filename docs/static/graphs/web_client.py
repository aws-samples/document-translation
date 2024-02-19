# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
from dataclasses import replace
from diagrams                import Diagram, Cluster
from diagrams.aws.mobile     import Appsync
from diagrams.aws.storage    import S3
from diagrams.aws.database   import DDB
from diagrams.aws.security   import Cognito
from diagrams.generic.device import Tablet
from diagrams.aws.network    import CloudFront
from diagrams.aws.security   import WAF

import attr

name = os.path.splitext(os.path.basename(__file__))[0]

graph_attr = {
    "margin":"0",
    "pad":"0"
}

with Diagram(filename=name, show=False, graph_attr=graph_attr):
    client = Tablet("Client")

    cache = CloudFront("Amazon CloudFront\n\n(Content Delivery Network)")
    hosting = S3("Amazon Simple\nStorage Service\n\n(Static Website)")
    waf     = WAF("AWS Web\nApplication Firewall\n\n(Firewall)")
    api     = Appsync("AWS AppSync\n\n(GraphQL API)") 
    auth    = Cognito("AWS Cognito\n\n(Authentication)")

    waf >> api

    client << cache
    cache << hosting

    client >> waf

    client >> auth