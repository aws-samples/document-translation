export enum cognitoMfaOption {
	"OFF" = "OFF",
	"REQUIRED" = "REQUIRED",
	"OPTIONAL" = "OPTIONAL",
}

export enum removalPolicy {
	DELETE = "DELETE",
	SNAPSHOT = "SNAPSHOT",
	RETAIN = "RETAIN",
}

export interface CommonMiscOptions {
	common_instance_name: string;
}

export interface CommonDevelopmentOptions {
	common_development_enable: boolean;
	app_removalPolicy?: string;
	pipeline_removalPolicy?: string;
}

export interface PipelineSourceOptions {
	pipeline_source_repoBranch: string;
	pipeline_source_repoHookEnable: boolean;
	pipeline_source_repoName: string;
	pipeline_source_repoOwner: string;
	pipeline_source_repoPeriodicChecksEnable: boolean;
	pipeline_source_repoTokenName: string;
}

export interface PipelineApprovalOptions {
	pipeline_approvals_preCdkSynth_email?: string;
	pipeline_approvals_preCdkSynth_enable: boolean;
}

export interface AppCognitoOptions {
	app_cognito_localUsers_enable: boolean;
	app_cognito_saml_enable: boolean;
}

export interface AppCognitoLocalOptions {
	app_cognito_localUsers_mfa_enforcement?: cognitoMfaOption;
	app_cognito_localUsers_mfa_otp?: boolean;
	app_cognito_localUsers_mfa_sms?: boolean;
}

export interface AppCognitoSamlOptions {
	app_cognito_saml_metadataUrl?: string;
}

export interface AppWebOptions {
	app_webUi_enable: boolean;
	app_webUi_customDomain_enable?: boolean;
	app_webUi_customDomain_name?: string;
	app_webUi_customDomain_certificateArn?: string;
}

export interface AppTranslationOptions {
	app_translation_enable: boolean;
	app_translation_lifecycle?: number;
	app_translation_pii_enable?: boolean;
	app_translation_pii_lifecycle?: number;
}

export interface AppReadableOptions {
	app_readable_enable: boolean;
	app_readable_bedrockRegion?: string;
}

export interface ConfigurationOptions {
	appCognitoLocalOptions: AppCognitoLocalOptions;
	appCognitoOptions: AppCognitoOptions;
	appCognitoSamlOptions: AppCognitoSamlOptions;
	appReadableOptions: AppReadableOptions;
	appTranslationOptions: AppTranslationOptions;
	appWebOptions: AppWebOptions;
	commonDevelopmentOptions: CommonDevelopmentOptions;
	commonMiscOptions: CommonMiscOptions;
	pipelineApprovalOptions: PipelineApprovalOptions;
	pipelineSourceOptions: PipelineSourceOptions;
}
