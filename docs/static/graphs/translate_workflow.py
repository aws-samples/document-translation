# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
from diagrams import Diagram
from diagrams.aws.storage import S3
from diagrams.aws.integration import SF
from diagrams.aws.ml import Translate
from diagrams.aws.compute import Lambda

import attr

name = os.path.splitext(os.path.basename(__file__))[0]
name_human = name.replace("_", " ").capitalize()

with Diagram(name_human, filename=name, show=False, graph_attr=attr.graph):
    sf_translate = SF("Translate")
    sf_CallbackSend = SF("Callback")
    translate = Translate("Document Translation")
    lambda_passS3EventToStepFunction = Lambda("Pass S3 Event to StepFunction")
    content = S3("Content")
    
    sf_translate >> translate

    translate >> content >> lambda_passS3EventToStepFunction >> sf_CallbackSend
    