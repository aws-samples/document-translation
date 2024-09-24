---
weight: 1
title: Improving Inclusion & Access to Information.
layout: hextra-home
tags: ["inclusion", "accessibility"]
---

{{< hextra/hero-container >}}
<div class="hx-mt-6 hx-mb-6">
{{< hextra/hero-headline >}}
<span class="hx-whitespace-nowrap">
	Improving Inclusion &
</span><br class="sm:hx-block hx-hidden" />
	Access to Information
{{< /hextra/hero-headline >}}
</div>

<div class="hx-mb-12">
{{< hextra/hero-subtitle >}}
<span class="hx-whitespace-nowrap">
	Translate documents from one language to another
</span><br class="sm:hx-block hx-hidden" />
	& transform documents into Easy Read formats
{{< /hextra/hero-subtitle >}}
</div>

<div class="hx-mb-6">
	{{< hextra/hero-button text="Get Started Now" link="docs/installation/" >}}
</div>
{{< /hextra/hero-container >}}

<!-- FEATURES -->

{{< hextra/feature-grid >}}
	{{< hextra/feature-card
		title="Document Translation"
		link="#document-translation"
		subtitle="Simple and easy document translation. Translate documents in up to 75 languages and dialects powered by Amazon Translate."
		class="hx-aspect-auto md:hx-aspect-[1.1/1] max-md:hx-min-h-[340px]"
		image="/img/feature_translation.png"
		imageClass="hx-absolute hx-max-w-none hx-top-[20%] hx-left-[24px] hx-w-[180%] sm:hx-w-[110%] dark:hx-opacity-80"
		style="background: radial-gradient(ellipse at 50% 80%,rgba(194,97,254,0.15),hsla(0,0%,100%,0));"
	>}}
	{{< hextra/feature-card
		title="Simply Readable"
		link="#simply-readable"
		subtitle="Create Easy Read documents quickly. Generate simplified text and images powered by Amazon Bedrock."
		class="hx-aspect-auto md:hx-aspect-[1.1/1] max-lg:hx-min-h-[340px]"
		image="/img/feature_readable.png"
		imageClass="hx-top-[0%] hx-left-[36px] hx-w-[180%] sm:hx-w-[110%] dark:hx-opacity-80"
		style="background: radial-gradient(ellipse at 50% 80%,rgba(142,53,74,0.15),hsla(0,0%,100%,0));"
	>}}
{{< /hextra/feature-grid >}}

<div class="hx-mt-6"></div>

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
<!-- OVERVIEW -->
<h2 style="font-size: 2.5rem; padding-top: 4rem">Overview</h2>
The project delivers a document transformation portal with a web front end and automated workflows for the various features.
<br/><br/>

User authentication is required and handled by [AWS Cognito](https://aws.amazon.com/cognito/). Cognito can be integrated into various Identity Providers including any that support SAML 2.0 (E.g. Active Directory).
<br/><br/>

The application is localised into 75 languages and dialects.
<br/><br/>

<div class="hx-mt-6" style="width: 100%;">
	{{< cards cols="1" >}}
		{{< card title="Multi Language UI" image="/img/client_multi_lang.png" subtitle="Localised into 75 languages & dialects" >}}
	{{< /cards >}}
</div>

<!-- DOCUMENT TRANSLATION -->
<h2 style="font-size: 2.5rem; padding-top: 4rem" id="document-translation">Document Translation</h2>

<p style="padding-top: 1rem;">This feature is capable of translating all languages supported by the <a style="color: rgb(59 130 246); display: contents;" href="https://aws.amazon.com/translate/">Amazon Translate</a> (75 at the time of writing) and can translate to them all in a single job submission.</p>

<div class="hx-mt-6" style="margin-top: 2rem; width: 100%;">
{{< hextra/feature-grid >}}
	{{< hextra/feature-card
		title="Case Study"
		link="https://aws.amazon.com/solutions/case-studies/swindon-borough-council-case-study-amazon-translate/"
		icon="document-text"
		subtitle="Swindon Borough Council Slashes Translation Costs by 99.96% Using Amazon Translate"
	>}}
	{{< hextra/feature-card
		title="Video"
		link="https://www.youtube.com/watch?v=g1VLiaYVjJE"
		icon="video-camera"
		subtitle="How Swindon Council used machine learning to cut translation costs by 99.6% – AWS Public Sector"
	>}}
	{{< hextra/feature-card
		title="Blog Post"
		link="https://aws.amazon.com/blogs/machine-learning/improving-inclusion-and-accessibility-through-automated-document-translation-with-an-open-source-app-using-amazon-translate/"
		icon="annotation"
		subtitle="Improving inclusion and accessibility through automated document translation with an open source app using Amazon Translate"
	>}}

	
{{< /hextra/feature-grid >}}
</div>

<div class="hx-mt-6">
	{{< cards cols="1" >}}
		{{< card title="Translations History Table" image="/img/client_translation_history.png" subtitle="Download & view translated documents" >}}
		{{< card title="New Translation Form" image="/img/client_translation_create.png" subtitle="Upload & translate a document" >}}
	{{< /cards >}}
</div>

<!-- SIMPLY READABLE -->
<h2 style="font-size: 2.5rem; padding-top: 4rem" id="simply-readable">Simply Readable</h2>

<p style="padding-top: 1rem;">This feature is capable of transforming documents into an Easy Read document. Complex text is simplified and images are generated as a visual description of the text using Generative AI powered by <a style="color: rgb(59 130 246); display: contents;" href="https://aws.amazon.com/bedrock/">Amazon Bedrock</a>.</p>

<div class="hx-mt-6" style="margin-top: 2rem; width: 100%;">
{{< hextra/feature-grid >}}
	{{< hextra/feature-card
		title="Video"
		link="https://www.youtube.com/watch?v=leQegdK-1M8"
		icon="video-camera"
		subtitle=" How to use generative AI to improve inclusivity | AWS Public Sector "
	>}}
{{< /hextra/feature-grid >}}
</div>


<div class="hx-mt-6">
	{{< cards cols="1" >}}
		{{< card title="Readable History Table" image="/img/client_readable_history.png" subtitle="View past Simply Readble jobs" >}}
		{{< card title="Readable Edit Form" image="/img/client_readable_create.png" subtitle="View & edit simplified documents" >}}
	{{< /cards >}}
</div>

