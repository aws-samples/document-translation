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
	common: {
		instance: {
			name: string;
		};
	};
}

export interface CommonDevelopmentOptions {
	common: {
		development: {
			enable: boolean;
		};
	};
	app: {
		removalPolicy?: string;
	};
	pipeline: {
		removalPolicy?: string;
	};
}

export interface PipelineSourceOptions {
	pipeline: {
		source: {
			repoBranch: string;
			repoHookEnable: boolean;
			repoName: string;
			repoOwner: string;
			repoPeriodicChecksEnable: boolean;
			repoTokenName: string;
		};
	};
}

export interface PipelineApprovalOptions {
	pipeline: {
		approvals: {
			preCdkSynth: {
				email?: string;
				enable: boolean;
			};
		};
	};
}

export interface AppCognitoOptions {
	app: {
		cognito: {
			localUsers: {
				enable: boolean;
			};
			saml: {
				enable: boolean;
				metadataUrl?: string;
			};
		};
	};
}

export interface AppCognitoLocalOptions {
	app: {
		cognito: {
			localUsers: {
				mfa: {
					enforcement?: cognitoMfaOption;
					otp?: boolean;
					sms?: boolean;
				};
			};
		};
	};
}

export interface AppCognitoSamlOptions {
	app: {
		cognito: {
			saml: {
				metadataUrl?: string;
			};
		};
	};
}

export interface AppWebOptions {
	app: {
		webUi: {
			enable: boolean;
			customDomain: {
				enable?: boolean;
				domain?: string;
				certificateArn?: string;
			};
		};
	};
}

export interface AppTranslationOptions {
	app: {
		translation: {
			enable: boolean;
			lifecycle?: number;
			pii: {
				enable?: boolean;
				lifecycle?: number;
			};
		};
	};
}

export interface AppReadableOptions {
	app: {
		readable: {
			enable: boolean;
			bedrockRegion?: string;
		};
	};
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
