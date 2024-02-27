---
title: Installation
weight: 003
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

This project is [configurable]({{< ref "docs/architecture" >}}) to suit your specific requirements. For a full explanation of the various options please review the feature configuration options in the [documentation]({{< ref "docs" >}}).

This form will collate your inputs and return the appropriate commands to enter for deployment. The output can be used with the [CloudShell]({{< ref "docs/shared/prerequisites/cloudshell" >}}) to quickly perform the installation. Please review the output to ensure you are happy with the values.

<button id="buttonCopy" style="display: none;"  onclick="copyToClipboard()">Copy</button>
<code id="result" style="display: none;"></code>
<button id="buttonCopy2" style="display: none;"  onclick="copyToClipboard()">Copy</button>
<form id="form">

{{% steps %}}

### Requires All
All fields in this section are required for all features you decide to enable.

<h4>General Information</h4>

<fieldset>
<div>
	<label for="accountId">AWS Account ID</label>
	<p class="sublabel" >The account ID being deployed into.</p>
	<input class="requiredForGitHub" type="text" name="accountId" placeholder="123456789012" maxlength="12" minlength="12" pattern="\d+" required/>
</div>
<div>
	<label for="sourceGitTag">Git Release Tag</label>
	<select id="sourceGitTag" name="sourceGitTag">
		<option value="v1.1.2">v1.1.2</option>
	</select>
</div>
</fieldset>

<h4>Source Service {{< info >}}/document-translation/docs/shared/configuration/source-service{{< /info >}}</h4>

<fieldset>
<div>
	<label for="sourceGitService">Service</label>
	<select name="sourceGitService">
		<option value="codecommit">AWS CodeCommit</option>
		<option value="github">GitHub</option>
	</select>
</div>
<div class="isForGitHub isNotForCodeCommit" style="display: none;">
	<label for="sourceGitRepoOwner">Repo Owner</label>
	<input class="requiredForGitHub" type="text" name="sourceGitRepoOwner" placeholder="username">
</div>
<div>
	<label for="sourceGitRepo">Repo Name</label>
	<input type="text" name="sourceGitRepo" placeholder="document-translation" value="document-translation" required>
</div>
<div>
	<label for="sourceGitBranch">Branch Name</label>
	<input type="text" name="sourceGitBranch" placeholder="main" value="main" required/>
</div>
</fieldset>

### Requires At Least One
At least one selection for user store is required. Select Cognito SAML, or Cognito Local, or both.

<h4><input type="checkbox" name="cognitoSamlUsers" checked/>Cognito SAML Users {{< info >}}/document-translation/docs/translation/configuration/options#enable-cognito-saml-provider-users{{< /info >}}</h4>

<fieldset>
<div class="isForCognitoSamlUsers">
	<label for="cognitoSamlMetadataUrl">Metadata URL</label>
	<input class="requiredForCognitoSamlUsers" type="text" name="cognitoSamlMetadataUrl" placeholder="https://domain.tld/path/to/metadata.xml?appid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required/>
</div>
<div class="isForCognitoSamlUsers">
	{{< callout type="info" >}}Post install steps are required to complete integration with the SAML provider. <a href='{{< ref "docs/shared/prerequisites/saml-provider" >}}'>SAML Provider Update</a>{{< /callout >}}
</div>
</fieldset>

<h4><input type="checkbox" name="cognitoLocalUsers"/>Cognito Local Users {{< info >}}/document-translation/docs/translation/configuration/options#enable-cognito-local-users{{< /info >}}</h4>

<fieldset>
<div class="isForCognitoLocalUsers" style="display: none;">
	<label for="cognitoLocalUsersMfa">MFA</label>
	<select name="cognitoLocalUsersMfa">
		<option value="required">Required</option>
		<option value="optional">Optional</option>
		<option value="off">Off</option>
	</select>
</div>
<div class="isForCognitoLocalUsersMfa" style="display: none;">
	<input type="checkbox" name="cognitoLocalUsersMfaOtp"/>
	<label class="checkbox" for="cognitoLocalUsersMfaOtp">MFA OTP</label>
</div>
<div class="isForCognitoLocalUsersMfa" style="display: none;">
	<input type="checkbox" name="cognitoLocalUsersMfaSms"/>
	<label class="checkbox" for="cognitoLocalUsersMfaSms">MFA SMS</label>
</div>
<div class="isForCognitoLocalUsers" style="display: none;">
	{{< callout type="info" >}}Post install steps are required to create Local Cognito Users. <a href='{{< ref "docs/shared/post-install/cognito-first-user" >}}'>Cognito First User</a>{{< /callout >}}
</div>
</fieldset>

### Optional: Web UI

Enable and configure the features you wish to deploy.

<h4><input type="checkbox" name="webUi" checked/>Web UI {{< info >}}/document-translation/docs/translation/configuration/options#enable-web-ui{{< /info >}}</h4>

<fieldset>
<div class="isForCognitoLocalUsers" style="display: none;">
	{{< callout type="info" >}}Post install steps are required to access the web user interface. <a target='_blank' href='{{< ref "docs/shared/post-install/web-ui" >}}'>Access Web UI</a>{{< /callout >}}
</div>
</fieldset>

<h4><input type="checkbox" name="customDomainEnable"/>Custom Domain {{< info >}}/document-translation/docs/shared/prerequisites/domain{{< /info >}}</h4>

<fieldset>
<div class="isForCustomDomain" style="display: none;">
	<label for="customDomainName">Domain Name</label>
	<input class="requiredForCustomDomain" type="text" name="customDomainName" placeholder="document-translation.business.com" required/>
</div>
<div class="isForCustomDomain" style="display: none;">
	<label for="customDomainCert">Certificate ARN</label>
	<input class="requiredForCustomDomain" type="text" name="customDomainCert" placeholder="arn:aws:acm:us-east-1:123456789012:certificate/abcdefgh-1234-5678-9012-ijklmnopqrst" required/>
</div>
</fieldset>

### Optional: Document Translation
<h4><input type="checkbox" name="translation" checked/>Document Translation {{< info >}}/document-translation/docs/translation/configuration/options#translation--translation-pii{{< /info >}}</h4>

<fieldset>
<div class="isForTranslation">
	<label for="translationLifecycleDefault">Expire files in days</label>
	<input class="requiredForTranslation" type="number" name="translationLifecycleDefault" min="1" placeholder="7" value="7" required/>
</div>
</fieldset>

<h4><input type="checkbox" name="piiDetectionEnable" checked/>Document Translation PII Detection {{< info >}}/document-translation/docs/translation/configuration/options#translation--translation-pii{{< /info >}}</h4>

<fieldset>
<div class="isForPiiDetection">
	<label for="piiDetectionLifecycle">Expire PII files in days</label>
	<input class="requiredForPiiDetection" type="number" name="piiDetectionLifecycle" min="1" placeholder="3" value="3" required/>
</div>
</fieldset>

### Optional: Simply Readable

<h4><input type="checkbox" name="readable" checked/>Readable {{< info >}}/document-translation/docs/translation/configuration/options#readable{{< /info >}}</h4>

<fieldset>
<div class="isForReadable">
<label for="readableBedrockRegion">Readable Bedrock Region</label>
{{< callout type="warning" >}}Amazon Bedrock is available in select regions. Simply Readable will send the input text to the selected region for processing with the Bedrock service.{{< /callout >}}
<select id="readableBedrockRegion" name="readableBedrockRegion">
	<option value="us-east-1">us-east-1 | US East (N. Virginia)</option>
	<option value="us-west-2">us-west-2 | US West (Oregon)</option>
	<option value="ap-southwest-1">ap-southwest-1 | Asia Pacific (Singapore)</option>
	<option value="ap-northeast-1">ap-northeast-1 | Asia Pacific (Tokyo)</option>
	<option value="eu-central-1">eu-central-1 | Europe (Frankfurt)</option>
</select>
<div class="isForCognitoSamlUsers">
	{{< callout type="info" >}}Post install steps are required to define your Generative AI models for text simplification and image generation. <a href='{{< ref "docs/readable/post-install/models" >}}'>Simply Readable Models</a>{{< /callout >}}
</div>
</div>
</fieldset>

{{% /steps %}}


<button>Generate</button>

</form>
<script src="../../js/quick-start.js"></script>