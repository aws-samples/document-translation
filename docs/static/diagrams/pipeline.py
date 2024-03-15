# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
from dataclasses import replace
from diagrams import Diagram, Cluster
from diagrams.aws.devtools import Codecommit, Codebuild, CloudDevelopmentKit
from diagrams.aws.management import Cloudformation

import attr

name = os.path.splitext(os.path.basename(__file__))[0]
name_human = name.replace("_", " ").title()

graph_attr = {
    "margin":"0",
    "pad":"0"
}

with Diagram(name_human, filename=name, show=False, graph_attr=graph_attr):

    #
    # PIPELINE
    # PIPELINE | NODES
    with Cluster("AWS CodePipeline"):
        code_commit = Codecommit("AWS CodeCommit\n(Git Repo)")
        code_build = Codebuild("AWS CodeBuild\n(CI)")
        code_cdk = CloudDevelopmentKit("AWS Cloud Development Kit \n(IaC)")

    code_commit >> code_build >> code_cdk

    cfn = Cloudformation("AWS CloudFormation\n(App Stack)")
    code_cdk >> cfn
