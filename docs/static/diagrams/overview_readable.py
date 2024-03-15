# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
from dataclasses import replace
from diagrams import Diagram, Cluster
from diagrams.aws.mobile import Appsync
from diagrams.aws.storage import S3
from diagrams.aws.database import DDB
from diagrams.aws.security import Cognito
from diagrams.aws.general import Client
from diagrams.aws.network import CloudFront
from diagrams.aws.security import WAF, Macie
from diagrams.aws.integration import SF
from diagrams.azure.identity import ActiveDirectory
from diagrams.aws.ml import Translate
from diagrams.aws.general import SDK

import attr

name = os.path.splitext(os.path.basename(__file__))[0]
name_human = name.replace("_", " ").capitalize()

with Diagram(name_human, filename=name, show=False, graph_attr=attr.graph):

    #
    # SHARED
    # SHARED | NODES
    with Cluster("Shared"):
        shared_client = Client("Client\n(AmplifyJS,\nCloudscape,\n& React)")
        with Cluster("Auth"):
            shared_auth    = Cognito("Amazon Cognito\n(User Auth)")
            shared_azuread = ActiveDirectory("Identity Provider\n(Azure AD/SAML 2.0)")
        with Cluster("API"):
            shared_api_waf     = WAF("AWS WAF\n(Firewall)")
            shared_api_api     = Appsync("AWS AppSync\n(GraphQL API)") 
        with Cluster("Web hosting"):
            shared_web_cache = CloudFront("Amazon CloudFront\n(Web Cache))")
            shared_web_hosting = S3("Amazon S3 Bucket\n(Static Web)")

    # SHARED | CONNECTIONS
    # SHARED | CONNECTIONS | WEB HOSTING
    shared_web_cache << shared_web_hosting
    shared_client << shared_web_cache
    # SHARED | CONNECTIONS | API
    shared_api_waf >> shared_api_api
    shared_client >> shared_api_waf
    # SHARED | CONNECTIONS | AUTH
    shared_client >> shared_auth >> shared_azuread

    #
    # HELP
    # HELP | NODES
    with Cluster("Help Info"):
        help_ddb = DDB("Amazon DynamoDB\n(Help Info)")

    # HELP | CONNECTIONS
    shared_api_api >> help_ddb

    #
    # READABLE
    # READABLE | NODES
    with Cluster("Simply Readable"):
        sr_content = S3("Amazon S3 Bucket\n(Generated Images)")
        sr_jobs = DDB("Amazon DynamoDB\n(Job History)")
        sr_models = DDB("Amazon DynamoDB\n(Model Definitions)")
        sr_sfn = SF("AWS Step Functions\n(Low-code Workflows)")
        sr_bedrock = SDK("Amazon Bedrock\n(Generative AI)")

    # READABLE | CONNECTIONS
    shared_api_api >> sr_jobs >> sr_sfn
    shared_api_api << sr_models >> sr_sfn
    shared_client >> sr_content << sr_sfn
    sr_sfn >> sr_bedrock
