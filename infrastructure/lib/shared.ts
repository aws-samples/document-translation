export interface SharedConfiguration {
	appRemovalPolicy: string;
	cognitoLocalUsers: boolean;
	cognitoLocalUsersMfa: string;
	cognitoLocalUsersMfaOtp: boolean;
	cognitoLocalUsersMfaSms: boolean;
	cognitoSamlMetadataUrl: string;
	cognitoSamlUsers: boolean;
	development: boolean;
	pipelineRemovalPolicy: string;
	pipelineApprovalPreCdkSynth: boolean;
	pipelineApprovalPreCdkSynthEmail: string;
	readable: boolean;
	readableBedrockRegion: string;
	instanceName: string;
	sourceGitRepo: string;
	sourceGitReleaseBranch: string;
	sourceGitUseRepoHook: boolean;
	translation: boolean;
	translationLifecycleDefault: number;
	translationLifecyclePii: number;
	translationPii: boolean;
	webUi: boolean;
	webUiCustomDomain: string;
	webUiCustomDomainCertificate: string;
}

const parseParameterName = (name: string) => {
	return `/doctran/<instanceName>/${name.replace(/_/g, "/")}`;
};

export function getSharedConfiguration(): SharedConfiguration {
	// Development
	const development =
		process.env.common_development_enable?.toLowerCase() === "true";

	// Cognito
	const cognitoLocalUsers =
		process.env.app_cognito_localUsers_enable?.toLowerCase() === "true";
	const cognitoLocalUsersMfa =
		process.env.app_cognito_localUsers_mfa_enforcement?.toLowerCase() || "off";
	const cognitoLocalUsersMfaOtp =
		process.env.app_cognito_localUsers_mfa_otp?.toLowerCase() === "true";
	const cognitoLocalUsersMfaSms =
		process.env.app_cognito_localUsers_mfa_sms?.toLowerCase() === "true";
	const cognitoSamlUsers =
		process.env.app_cognito_saml_enable?.toLowerCase() === "true";
	const cognitoSamlMetadataUrl = process.env.app_cognito_saml_metadataUrl || "";

	// Translation
	const translation =
		process.env.app_translation_enable?.toLowerCase() === "true";
	const translationPii =
		process.env.app_translation_pii_enable?.toLowerCase() === "true";
	const translationLifecycleDefault = parseInt(
		process.env.app_translation_lifecycle || "7",
	);
	const translationLifecyclePii = parseInt(
		process.env.app_translation_pii_lifecycle || "3",
	);

	// Readable
	const readable = process.env.app_readable_enable?.toLowerCase() === "true";
	const readableBedrockRegion =
		process.env.app_readable_bedrockRegion?.toLowerCase() || "";
	if (readable && !readableBedrockRegion) {
		throw new Error(
			`${parseParameterName(
				"app_readable_bedrockRegion",
			)} is required when ${parseParameterName("app_readable_enable")} is true`,
		);
	}

	// Web UI
	const webUi = process.env.app_webUi_enable?.toLowerCase() === "true";
	const webUiCustomDomainEnable =
		process.env.app_webUi_customDomain_enable?.toLowerCase() === "true";
	let webUiCustomDomain = "";
	let webUiCustomDomainCertificate = "";
	if (webUiCustomDomainEnable) {
		webUiCustomDomain =
			process.env.app_webUi_customDomain_enable?.toLowerCase() || "";
		webUiCustomDomainCertificate =
			process.env.app_webUi_customDomain_certificateArn || "";
	}

	// Source
	const sourceGitRepoOwner =
		process.env.pipeline_source_repoOwner || "aws-samples";
	const sourceGitRepoName =
		process.env.pipeline_source_repoName || "document-translation";
	const sourceGitRepo = `${sourceGitRepoOwner}/${sourceGitRepoName}`;
	const instanceName = process.env.common_instance_name || "main";
	const sourceGitReleaseBranch = process.env.pipeline_source_repoBranch || "";
	if (!sourceGitReleaseBranch) {
		throw new Error(
			`${parseParameterName("pipeline_source_repoBranch")} is required`,
		);
	}
	const sourceGitUseRepoHook =
		process.env.pipeline_source_repoHook_enable?.toLowerCase() === "true";

	// Removal
	const appRemovalPolicy = process.env.app_removalPolicy?.toLowerCase() || "";
	const pipelineRemovalPolicy =
		process.env.pipeline_removalPolicy?.toLowerCase() || "";

	// Manual Approval
	const pipelineApprovalPreCdkSynth =
		process.env.pipeline_approvals_preCdkSynth_enable?.toLowerCase() !==
		"false";
	const pipelineApprovalPreCdkSynthEmail =
		process.env.pipeline_approvals_preCdkSynth_email?.toLowerCase() || "";
	if (
		(pipelineApprovalPreCdkSynth &&
			pipelineApprovalPreCdkSynthEmail == undefined) ||
		(pipelineApprovalPreCdkSynth && pipelineApprovalPreCdkSynthEmail == "")
	) {
		throw new Error(
			`${parseParameterName(
				"pipeline_approvals_preCdkSynth_email",
			)} is required when ${parseParameterName(
				"pipeline_approvals_preCdkSynth_enable",
			)} is true`,
		);
	}

	return {
		appRemovalPolicy,
		cognitoLocalUsers,
		cognitoLocalUsersMfa,
		cognitoLocalUsersMfaOtp,
		cognitoLocalUsersMfaSms,
		cognitoSamlMetadataUrl,
		cognitoSamlUsers,
		development,
		pipelineApprovalPreCdkSynth,
		pipelineApprovalPreCdkSynthEmail,
		pipelineRemovalPolicy,
		readable,
		readableBedrockRegion,
		instanceName,
		sourceGitRepo,
		sourceGitReleaseBranch,
		sourceGitUseRepoHook,
		translation,
		translationLifecycleDefault,
		translationLifecyclePii,
		translationPii,
		webUi,
		webUiCustomDomain,
		webUiCustomDomainCertificate,
	};
}
