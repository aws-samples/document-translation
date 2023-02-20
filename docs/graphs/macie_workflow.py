# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
from diagrams import Diagram
from diagrams.aws.storage import S3
from diagrams.aws.security import Macie
from diagrams.aws.integration import SF
from diagrams.aws.compute import Lambda
from diagrams.aws.management import Cloudwatch

import attr

name = os.path.splitext(os.path.basename(__file__))[0]
name_human = name.replace("_", " ").capitalize()

with Diagram(name_human, filename=name, show=False, graph_attr=attr.graph):
    sf_main = SF("Pii")
    sf_CallbackSend = SF("Callback")
    macie = Macie("PII Detection")
    lambda_parseMacieResult = Lambda("Parse Macie Result")

    sf_main >> macie

    macie >> Cloudwatch("Job Complete Log Subscription") >> lambda_parseMacieResult >> sf_CallbackSend
