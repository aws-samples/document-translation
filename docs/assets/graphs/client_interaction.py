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
name_human = name.replace("_", " ").capitalize()

with Diagram(name_human, filename=name, show=False, graph_attr=attr.graph):
    client = Tablet("Amplify React client")
    
    with Cluster("Web hosting"):
        cache = CloudFront("CloudFront Cache")
        hosting = S3("Static Web")
    content = S3("User Content")
    waf     = WAF("WAF")
    api     = Appsync("GraphQL API") 
    auth    = Cognito("Cognito auth")
    db_jobs = DDB("Jobs")

    waf >> api
    api >> db_jobs

    client >> cache
    cache >> hosting
    client >> content
    client >> waf
    client >> auth
