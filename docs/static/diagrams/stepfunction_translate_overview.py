# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
from diagrams import Diagram
from diagrams.aws.storage import S3
from diagrams.aws.database import DDB, DynamodbTable
from diagrams.aws.security import Macie
from diagrams.aws.integration import SF
from diagrams.aws.ml import Translate

import attr

name = os.path.splitext(os.path.basename(__file__))[0]
name_human = name.replace("_", " ").capitalize()

with Diagram(name_human, filename=name, show=False, graph_attr=attr.graph):
    sf_main = SF("Main")
    sf_translate = SF("Translate")
    translate = Translate("Amazon Translate")
    
    db_jobs = DDB("Jobs")
    content = S3("Content")
    
    DynamodbTable("Table Stream") >> sf_main

    sf_main >> sf_translate
    sf_translate >> translate
    sf_translate >> db_jobs
    sf_translate >> content
