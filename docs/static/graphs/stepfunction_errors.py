# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import os
from diagrams import Diagram
from diagrams.aws.integration import SF, Eventbridge

import attr

name = os.path.splitext(os.path.basename(__file__))[0]
name_human = name.replace("_", " ").capitalize()

with Diagram(name_human, filename=name, show=False, graph_attr=attr.graph):
    SF("Non successful state") >> Eventbridge("Failure Event") >> SF("Mark as not Success")