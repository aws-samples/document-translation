// FORM REPO TAGS
async function getRepoTags(){
	const response = await fetch("https://api.github.com/repos/aws-samples/document-translation/tags")
	const repoTags = await response.json()
	var options = ""
	repoTags.forEach(tag => {
		options += `<option value="${tag.name}">${tag.name}</option>`
	});

	const sourceGitTag = document.getElementById("sourceGitTag")
	sourceGitTag.innerHTML = options
}
getRepoTags()

// FORM INTERACTION
const form = document.getElementById('form');

function setElementDisplay(className, newState){
	const elements = document.getElementsByClassName(className);
	for (var i = 0; i < elements.length; i++) {
		elements[i].style.display = newState;
	}
}

function setElementRequired(className, newState){
	const elements = document.getElementsByClassName(className);
	for (var i = 0; i < elements.length; i++) {
		elements[i].required = newState;
	}
}

function filterFormFields(className, newState){
	setElementRequired("requiredFor" + className, newState)
	if (newState){
		setElementDisplay("isFor" + className, "block")
		setElementDisplay("isNotFor" + className, "none")
	} else{
		setElementDisplay("isFor" + className, "none")
		setElementDisplay("isNotFor" + className, "block")
	}
}

function updateFormFields() {
	filterFormFields("PiiDetection", form.piiDetectionEnable.checked);
	filterFormFields("CustomDomain", form.customDomainEnable.checked);
	filterFormFields("CognitoLocalUsers", form.cognitoLocalUsers.checked);
	filterFormFields("CognitoSamlUsers", form.cognitoSamlUsers.checked);
	filterFormFields("Translation", form.translation.checked);
	filterFormFields("Readable", form.readable.checked);

	if (form.sourceGitService.value == "codecommit"){
		filterFormFields("CodeCommit", true);
		filterFormFields("GitHub", false);
	} else if (form.sourceGitService.value == "github"){
		filterFormFields("CodeCommit", false);
		filterFormFields("GitHub", true);
	}

	if (form.cognitoLocalUsers.checked && form.cognitoLocalUsersMfa.value == "required" || form.cognitoLocalUsers.checked && form.cognitoLocalUsersMfa.value == "optional"){
		filterFormFields("CognitoLocalUsersMfa", true);
	} else {
		filterFormFields("CognitoLocalUsersMfa", false);
	}
}

form.addEventListener('change', function() {
	updateFormFields();
});

// FORM HANLDER
var output = "";
function appendSection(description){
	output += "\n# " + description + "\n"
}
function appendStep(description, command){
	output += command.trim() +  " # " + description + "\n"
}

function handleForm(event) {
	event.preventDefault();
	const data = Object.fromEntries(new FormData(event.target).entries())

	console.log(data);

	appendSection('----------')
	appendSection('Configuration')
	if (data.piiDetectionEnable === "on") {
		appendSection('PII Detection')
		appendStep('Enable Macie', 'aws macie2 enable-macie')
		appendStep('Create Macie log group', 'aws logs create-log-group --log-group-name /aws/macie/classificationjobs')
		appendStep('Enable PII detection', `export translationPii="true"`)
		appendStep('Set PII lifecycle', `export translationLifecyclePii="${data.piiDetectionLifecycle}"`)
	};

	if (data.customDomainEnable === "on") {
		appendSection('Custom Domain')
		appendStep('Set custom domain name', `export webUiCustomDomain="${data.customDomainName}"`)
		appendStep('Set custom domain certificate', `export webUiCustomDomainCertificate="${data.customDomainCert}"`)
	};
	if (data.sourceGitService){
		switch (data.sourceGitService) {
			case "codecommit":
				appendSection('Source Service CodeCommit')
				appendStep('Set repo name', `export sourceGitRepo="${data.sourceGitRepo}"`)
				appendStep('Create CodeCommit repo', `aws codecommit create-repository --repository-name ${data.sourceGitRepo}`)
				break;
			case "github":
				appendSection('Source Service GitHub')
				appendStep('Set source service', `export sourceGitService="${data.sourceGitService}"`)
				appendStep('Set repo name', `export sourceGitRepo="${data.sourceGitRepoOwner}/${data.sourceGitRepo}"`)
				break;
		}
		appendStep('Set branch name', `export sourceGitBranch="${data.sourceGitBranch}"`)
	}
	if (data.cognitoLocalUsers === "on") {
		appendSection('Cognito Local Users')
		appendStep('Enable Cognito local users', `export cognitoLocalUsers="true"`)
		appendStep('Set MFA enforcement', `export cognitoLocalUsersMfa="${data.cognitoLocalUsersMfa}"`)
		if (data.cognitoLocalUsersMfaOtp === "on") {
			appendStep('Enable MFA type OTP', `export cognitoLocalUsersMfaOtp="true"`)
		}
		if (data.cognitoLocalUsersMfaSms === "on") {
			appendStep('Enable MFA type SMS', `export cognitoLocalUsersMfaSms="true"`)
		}
	};

	if (data.cognitoSamlUsers === "on") {
		appendSection('Cognito SAML Users')
		appendStep('Enable Cognito SAML users', `export cognitoSamlUsers="true"`)
		appendStep('Set SAML metadata URL', `export cognitoSamlMetadataUrl="${data.cognitoSamlMetadataUrl}"`)
	};

	if (data.webUi === "on") {
		appendSection('Web UI')
		appendStep('Enable Web UI', `export webUi="true"`)
	};
	if (data.translation === "on") {
		appendSection('Translation')
		appendStep('Enable Translation', `export translation="true"`)
		appendStep('Set default lifecycle', `export translationLifecycleDefault="${data.translationLifecycleDefault}"`)
	};
	if (data.readable === "on") {
		appendSection('Readable')
		appendStep('Enable Readable', `export readable="true"`)
		appendStep('Set Readable Bedrock region', `export readableBedrockRegion="${data.readableBedrockRegion}"`)
	};

	appendSection('----------')
	appendSection('Deployment')

	appendSection('CDK Bootstrap')
	appendStep('Bootstrap the account', `cdk bootstrap aws://${data.accountId}/\${AWS_REGION}`)

	appendSection('Clone source code')
	appendStep('Clone the upstream project git repository', 'git clone https://github.com/aws-samples/document-translation.git')
	appendStep('Change directory into the pulled project directory', 'cd document-translation')
	appendStep('Fetch available tags', 'git fetch --all --tags')
	appendStep('View tags', 'git tag')
	appendStep('Checkout tag', `git checkout tags/${data.sourceGitTag}`)

	appendSection('Push source code to your CodeCommit')
	appendStep('Enable the AWS CLI git credentials helper', `git config --global credential.helper '!aws codecommit credential-helper $@'`)
	appendStep('Enable the AWS CLI git credentials helper', 'git config --global credential.UseHttpPath true')
	appendStep('Add CodeCommit as a remote', `git remote add codecommit https://git-codecommit.\${AWS_REGION}.amazonaws.com/v1/repos/${data.sourceGitRepo}`)
	appendStep('Push files', `git push codecommit ${data.sourceGitBranch}`)

	appendSection('Deploy the pipeline ')
	appendStep('Change directory into the infrastructure directory', `cd infrastructure`)
	appendStep('Install node dependencies', `npm install`)
	appendStep('Deploy', `cdk deploy`)

	const result = document.getElementById('result');
	const buttonCopy = document.getElementById('buttonCopy');

	result.innerText = output;
	form.style.display = "none";
	result.style.display = "block";
	buttonCopy.style.display = "block";
	console.log(output);
}
form.addEventListener('submit', handleForm);

function copyToClipboard() {
	const result = document.getElementById('result');
	navigator.clipboard.writeText(result.innerText);
	console.log("Results copied to clipboard");
}

// FORM STYLE
const styles = `
	/* LAYOUT */
	form label {
		font-weight: bold;
	}
	form .sublabel {
		opacity: 0.5;
		margin: 0;
	}
	form label,
	form input,
	form select {
		display: block;
		box-sizing: border-box;
	}
	form input,
	form select {
		padding: 0.5rem;
		margin: 0.5rem 0;
		width: 100%;
		min-width: 100%;
	}
	form input[type=checkbox],
	form label.checkbox {
		display: inline-block;
	}

	form h4 input[type=checkbox]{
		margin: 1rem;
	}

	/* STYLE */
	.info {
		text-decoration: none;
	}
	button {
		background-color: #006be6;
		color: white;
		padding: 1rem;
		text-align: center;
		cursor: pointer;
		border-radius: 2rem;
	}
	button#buttonCopy {
		background-color: #00C87F;
	}
	form input {
		border: 1px solid;
		border-radius: 0.25rem;
	}
	form button {
		margin: 1rem !important;
	}
	form input[type="checkbox"] {
		height: 1rem;
		vertical-align: middle;
		width: 1rem !important;
		min-width: 1rem !important;
		max-width: 1rem !important;
	}
	form fieldset {
		border-width: 1px 0 0 0;
		margin-bottom: 1rem;
	}
	form fieldset legend {
		font-weight: bold;
	}
	form fieldset legend .info {
		font-weight: lighter;
		font-size: 0.75rem;
	}
	
	/* VALIDATION */
	form input:invalid {
		border-color: #ff9e9e;
	}
	input:valid {
		border-color: #67e867;
	}
`
const styleSheet = document.createElement("style")
styleSheet.innerText = styles
document.head.appendChild(styleSheet)