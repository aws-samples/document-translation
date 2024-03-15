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
name_human = name.replace("_", " ").title()

graph_attr = {
    "margin":"0",
    "pad":"0"
}

with Diagram(name_human, filename=name, show=False, graph_attr=graph_attr):

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
