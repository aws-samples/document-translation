---
layout: default
title: Quick Start
nav_order: 2
has_children: false
---

<!--
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
-->

This project is [configurable]({{ site.baseurl }}/docs/architecture/features) to suit your specific requirements. For a full explanation of the various options please review the [full installation guide]({{ site.baseurl }}/docs/installation/). If an option is unclear to you please refer to the full guide.

This form will collate your inputs and return the appropriate commands to enter for deployment. The output can be used with the [CloudShell]({{ site.baseurl }}/docs/installation/prerequisite/cloudshell) to quickly perform the installation. Please review the output to ensure you are happy with the values.

<code id="result" style="display: none;"></code>
<button id="buttonCopy" style="display: none;"  onclick="copyToClipboard()" class="btn btn-green">Copy</button>
<form id="form">
	<h2>Requires All</h2>
	<p>All fields in this section are required for all features you decide to enable.</p>
	<fieldset>
		<h4>General Information</h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="accountId">AWS Account ID</label>
			<input class="formOptionInput requiredForGitHub" type="text" name="accountId" placeholder="123456789012" maxlength="12" minlength="12" pattern="\d+" required/>
		</div>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="sourceGitTag">Git Release Tag</label>
			<select id="sourceGitTag" class="formOptionInput" name="sourceGitTag">
                <option value="v1.1.2">v1.1.2</option>
			</select>
		</div>
	</fieldset>
	<fieldset>
		<h4>Source Service <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/source-service/">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="sourceGitService">Service</label>
			<select class="formOptionInput" name="sourceGitService">
				<option value="codecommit">AWS CodeCommit</option>
				<option value="github">GitHub</option>
			</select>
		</div>
		<div class="formOptionGroup isForGitHub isNotForCodeCommit" style="display: none;">
			<label class="formOptionLabel" for="sourceGitRepoOwner">Repo Owner</label>
			<input class="formOptionInput requiredForGitHub" type="text" name="sourceGitRepoOwner" placeholder="username">
		</div>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="sourceGitRepo">Repo Name</label>
			<input class="formOptionInput" type="text" name="sourceGitRepo" placeholder="document-translation" required>
		</div>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="sourceGitBranch">Branch Name</label>
			<input class="formOptionInput" type="text" name="sourceGitBranch" placeholder="main" required/>
		</div>
	</fieldset>
	<h2>Requires At Least One</h2>
	<p>At least one selection for user store is required. Select Cognito SAML, or Cognito Local, or both.</p>
	<fieldset>
		<h4>Cognito SAML Users <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/configuration/options.html#enable-cognito-saml-provider-users">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="cognitoSamlUsers">Enable</label>
			<input class="formOptionInput" type="checkbox" name="cognitoSamlUsers" checked/>
		</div>
		<div class="formOptionGroup isForCognitoSamlUsers">
			<label class="formOptionLabel" for="cognitoSamlMetadataUrl">Metadata URL</label>
			<input class="formOptionInput requiredForCognitoSamlUsers" type="text" name="cognitoSamlMetadataUrl" placeholder="https://domain.tld/path/to/metadata.xml?appid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required/>
		</div>
		<blockquote class="note-title isForCognitoSamlUsers">
			<p>Note</p>
			<p>Post install steps are required to complete integration with the SAML provider.</p>
			<p><a href="{{ site.baseurl }}/docs/installation/post-install/saml-provider-update.html">SAML Provider Update</a></p>
		</blockquote>
	</fieldset>
	<fieldset>
		<h4>Cognito Local Users <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/configuration/options.html#enable-cognito-local-users">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="cognitoLocalUsers">Enable</label>
			<input class="formOptionInput" type="checkbox" name="cognitoLocalUsers"/>
		</div>
		<div class="formOptionGroup isForCognitoLocalUsers" style="display: none;">
			<label class="formOptionLabel" for="cognitoLocalUsersMfa">MFA</label>
			<select class="formOptionInput" name="cognitoLocalUsersMfa">
				<option value="required">Required</option>
				<option value="optional">Optional</option>
				<option value="off">Off</option>
			</select>
		</div>
		<div class="formOptionGroup isForCognitoLocalUsersMfa" style="display: none;">
			<label class="formOptionLabel" for="cognitoLocalUsersMfaOtp">MFA OTP</label>
			<input class="formOptionInput" type="checkbox" name="cognitoLocalUsersMfaOtp"/>
		</div>
		<div class="formOptionGroup isForCognitoLocalUsersMfa" style="display: none;">
			<label class="formOptionLabel" for="cognitoLocalUsersMfaSms">MFA SMS</label>
			<input class="formOptionInput" type="checkbox" name="cognitoLocalUsersMfaSms"/>
		</div>
		<blockquote class="note-title isForCognitoLocalUsers">
			<p>Note</p>
			<p>Post install steps are required to create Local Cognito Users.</p>
			<p><a href="{{ site.baseurl }}/docs/installation/post-install/cognito-first-user.html">Cognito First User</a></p>
		</blockquote>
	</fieldset>
	<h2>Features</h2>
	<p>Enable and configure the features you wish to deploy.</p>
	<h3>Web UI</h3>
	<fieldset>
		<h4>Web UI <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/configuration/options.html#enable-web-ui">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="webUi">Enable</label>
			<input class="formOptionInput" type="checkbox" name="webUi" checked/>
		</div>
		<blockquote class="note-title isForCognitoLocalUsers">
			<p>Note</p>
			<p>Post install steps are required to access the web user interface.</p>
			<p><a href="{{ site.baseurl }}/docs/installation/post-install/web-ui.html">Access Web UI</a></p>
		</blockquote>
	</fieldset>
	<fieldset>
		<h4>Custom Domain <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/prerequisite/domain.html">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="customDomainEnable">Enable</label>
			<input class="formOptionInput" type="checkbox" name="customDomainEnable"  checked/>
		</div>
		<div class="formOptionGroup isForCustomDomain">
			<label class="formOptionLabel" for="customDomainName">Domain Name</label>
			<input class="formOptionInput requiredForCustomDomain" type="text" name="customDomainName" placeholder="document-translation.business.com" required/>
		</div>
		<div class="formOptionGroup isForCustomDomain">
			<label class="formOptionLabel" for="customDomainCert">Certificate ARN</label>
			<input class="formOptionInput requiredForCustomDomain" type="text" name="customDomainCert" placeholder="arn:aws:acm:us-east-1:123456789012:certificate/abcdefgh-1234-5678-9012-ijklmnopqrst" required/>
		</div>
	</fieldset>
	<h3>Document Translation</h3>
	<fieldset>
		<h4>Document Translation <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/configuration/options.html#translation--translation-pii">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="translation">Enable</label>
			<input class="formOptionInput" type="checkbox" name="translation" checked/>
		</div>
		<div class="formOptionGroup isForTranslation">
			<label class="formOptionLabel" for="translationLifecycleDefault">Expire files in days</label>
			<input class="formOptionInput requiredForTranslation" type="number" name="translationLifecycleDefault" min="1" placeholder="7" required/>
		</div>
	</fieldset>
	<fieldset>
		<h4>Document Translation PII Detection <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/configuration/options.html#translation--translation-pii">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="piiDetectionEnable">Enable</label>
			<input class="formOptionInput" type="checkbox" name="piiDetectionEnable" checked/>
		</div>
		<div class="formOptionGroup isForPiiDetection">
			<label class="formOptionLabel" for="piiDetectionLifecycle">Expire PII files in days</label>
			<input class="formOptionInput requiredForPiiDetection" type="number" name="piiDetectionLifecycle" min="1" placeholder="3" required/>
		</div>
	</fieldset>
	<h3>Simply Readable</h3>
	<fieldset>
		<h4>Readable <a class="info" target="_blank" href="{{ site.baseurl }}/docs/installation/configuration/options.html#readable">(info)</a></h4>
		<div class="formOptionGroup">
			<label class="formOptionLabel" for="readable">Enable</label>
			<input class="formOptionInput" type="checkbox" name="readable" checked/>
		</div>
		<div class="formOptionGroup isForReadable">
			<blockquote class="note-title isForCognitoLocalUsers">
				<p>Note</p>
				<p>Amazon Bedrock is available in select regions. Simply Readable will send the input text to the selected region for processing with the Bedrock service.</p>
				<p><a href="{{ site.baseurl }}/docs/installation/post-install/web-ui.html">Access Web UI</a></p>
			</blockquote>
			<label class="formOptionLabel" for="readableBedrockRegion">Readable Bedrock Region</label>
			<select id="readableBedrockRegion" class="formOptionInput" name="readableBedrockRegion">
                <option value="us-east-1">us-east-1 | US East (N. Virginia)</option>
                <option value="us-west-2">us-west-2 | US West (Oregon)</option>
                <option value="ap-southwest-1">ap-southwest-1 | Asia Pacific (Singapore)</option>
                <option value="ap-northeast-1">ap-northeast-1 | Asia Pacific (Tokyo)</option>
                <option value="eu-central-1">eu-central-1 | Europe (Frankfurt)</option>
			</select>
		</div>
	</fieldset>
	
    <button type="submit" class="btn btn-blue">Generate</button>
</form>
<script src="{{ site.baseurl }}/assets/js/quick-start.js"></script>