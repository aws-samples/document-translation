---
title: Architecture
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

This app is created with a modular architecture to enable the growth of future capabilities and managability of the code. There are shared features and non-shared features. Shared features are deployed for all configurations whilst non-shared features are only deployed when those features are enabled. 

This documentation is split with that in mind. This page will cover a high level overview of how these modules are interconnected, leaving module specific details to their respective pages in this documentation.

## Feature Overview

### Shared Features
{{< cards >}}
  {{< card link="./api-auth" title="API & Auth" icon="cloud" >}}
  {{< card link="./web-ui" title="Web UI" icon="cloud" >}}
  {{< card link="./help-info" title="Help Info" icon="cloud" >}}
{{< /cards >}}

### Feature Specific
{{< cards >}}
  {{< card link="./document-translation" title="Document Translation" icon="cloud" >}}
  {{< card link="./simply-readable" title="Simply Readable" icon="cloud" >}}
{{< /cards >}}

## Feature Dependency 

```mermaid
flowchart TD
    %% NODES
    cognitoLocal["Cognito Local Users"]
    cognitoSaml["Cognito SAML Users"]
    api["API"]
    help["Help"]
    web["Website"]
    dt["Translation"]
    dtPii["PII Detection"]
    sr["Readable"]

    %% LINKS
    help   -- Depends on --> api
    web   -- Depends on --> api
    dtPii -- Depends on --> dt -- Depends on --> api
    sr    -- Depends on --> api

    api   -- Depends on --> cognitoLocal
    api   -- Depends on --> cognitoSaml

    %% GROUPS
    subgraph Document Translation*
      dt
      dtPii
    end

    subgraph Simply Readable*
      sr
    end

    subgraph Shared
      subgraph Help Info
        help
      end
      subgraph Web UI*
        web
      end

      subgraph API & Auth
        api

        subgraph Requires at least one**
            cognitoLocal
            cognitoSaml
        end
      end
    end
```

**Key**: \* Optional. \*\* Requires at least one.

## Feature Architecture
This overview shows how the differnt features are interconnected via the various services. For a detailed view of a feature please refer to the specific page for that in this documentation.

![Overview](/diagrams/overview.png)