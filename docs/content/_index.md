---
weight: 1
title: Improving Inclusion & Access to Information.
layout: hextra-home
---

<div class="hx-mt-6 hx-mb-6">
{{< hextra/hero-headline >}}
  Improving Inclusion &&nbsp;<br class="sm:hx-block hx-hidden" />Access to Information
{{< /hextra/hero-headline >}}
</div>
&nbsp;

<div class="hx-mb-12">
{{< hextra/hero-subtitle >}}
  Translate documents from one language to another&nbsp;<br class="sm:hx-block hx-hidden" />& transform documents into Easy Read formats
{{< /hextra/hero-subtitle >}}
</div>
&nbsp;

<div class="hx-mb-6">
{{< hextra/hero-button text="Get Started Now" link="docs/installation/" >}}
</div>
&nbsp;

{{< hextra/feature-grid >}}
  {{< hextra/feature-card
    title="Document Translation"
    subtitle="Simple and easy document translation. Translate documents in up to 75 languages and dialects powered by Amazon Translate."
    class="hx-aspect-auto md:hx-aspect-[1.1/1] max-md:hx-min-h-[340px]"
    image=""
    imageClass="hx-top-[40%] hx-left-[24px] hx-w-[180%] sm:hx-w-[110%] dark:hx-opacity-80"
    style="background: radial-gradient(ellipse at 50% 80%,rgba(194,97,254,0.15),hsla(0,0%,100%,0));"
  >}}
  {{< hextra/feature-card
    title="Simply Readable"
    subtitle="Create Easy Read documents quickly. Generate simplified text and images powered by Amazon Bedrock."
    class="hx-aspect-auto md:hx-aspect-[1.1/1] max-lg:hx-min-h-[340px]"
    image=""
    imageClass="hx-top-[40%] hx-left-[36px] hx-w-[180%] sm:hx-w-[110%] dark:hx-opacity-80"
    style="background: radial-gradient(ellipse at 50% 80%,rgba(142,53,74,0.15),hsla(0,0%,100%,0));"
  >}}
{{< /hextra/feature-grid >}}
&nbsp;

{{< hextra/feature-grid >}}
  {{< hextra/feature-card
    title="Open Source"
    subtitle="The app and infrastucture as code is all open source. Free for commercial use, modification, distribution, and private use."
  >}}
  {{< hextra/feature-card
    title="Simple Web Interface"
    subtitle="Self serve document transformations with a simple and clean web user interface."
  >}}
  {{< hextra/feature-card
    title="Single Sign On"
    subtitle="Integrate with your existing identity provider for user access controls."
  >}}
{{< /hextra/feature-grid >}}
&nbsp;

## **Overview**
The project delivers a document transformation portal with a web front end and automated workflows for the various features.
<br/><br/>

User authentication is required and handled by [AWS Cognito](https://aws.amazon.com/cognito/). Cognito can be integrated into various Identity Providers including any that support SAML 2.0 (E.g. Active Directory).
<br/><br/>

The application is localised into 75 languages and dialects.
<br/><br/>

![Web UI - Multiple Languages](/img/client_multi_lang.png)
<br/><br/>

## **Feature: Document Translation**
This feature is capable of translating all languages supported by the [Amazon Translate](https://aws.amazon.com/translate/) (75 at the time of writing) and can translate to them all in a single job submission.
<br/><br/>
Video Case Study: [https://www.youtube.com/watch?v=g1VLiaYVjJE](https://www.youtube.com/watch?v=g1VLiaYVjJE)<br/>
Text Case Study: [https://aws.amazon.com/solutions/case-studies/swindon-borough-council-case-study-amazon-translate/](https://aws.amazon.com/solutions/case-studies/swindon-borough-council-case-study-amazon-translate/)
<br/><br/>

![Web UI - My Translations Table](/img/client_translation_history.png)
<br/><br/>

![Web UI - New Translation Form](/img/client_translation_create.png)
<br/><br/>

## **Feature: Simply Readable**
This feature is capable of transforming documents into an Easy Read document. Complex text is simplified and images are generated as a visual description of the text using Generative AI powered by [Amazon Bedrock](https://aws.amazon.com/bedrock/).
<br/><br/>
Video Case Study: [https://www.youtube.com/watch?v=leQegdK-1M8](https://www.youtube.com/watch?v=leQegdK-1M8)
<br/><br/>

![Web UI - My Translations Table](/img/client_readable_history.png)
<br/><br/>

![Web UI - New Translation Form](/img/client_readable_create.png)
<br/><br/>
