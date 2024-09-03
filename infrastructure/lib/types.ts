export type CommonConfig = {
	development: {
		enable: boolean;
	};
	instance: {
		name: string;
	};
};

export type PipelineConfig = {
	approvals: {
		preCdkSynth: {
			email?: string;
			enable: boolean;
		};
	};
	removalPolicy?: string;
	source: {
		repoBranch: string;
		repoHook: {
			enable: boolean;
		};
		repoName: string;
		repoOwner: string;
	};
};

export type AppConfig = {
	cognito: {
		localUsers: {
			enable: boolean;
			mfa: {
				enforcement?: string;
				otp?: boolean;
				sms?: boolean;
			};
		};
		saml: {
			enable: boolean;
			metadataUrl?: string;
		};
	};
	readable: {
		bedrockRegion?: string;
		enable: boolean;
	};
	removalPolicy?: string;
	translation: {
		enable: boolean;
		lifecycle?: number;
		pii: {
			enable?: boolean;
			lifecycle?: number;
		};
	};
	webUi: {
		customDomain: {
			certificateArn?: string;
			enable?: boolean;
			domain?: string;
		};
		enable?: boolean;
	};
};

export type Config = {
	common: CommonConfig;
	pipeline: PipelineConfig;
	app: AppConfig;
};

export const defaultConfig: Config = {
	common: {
		development: {
			enable: false,
		},
		instance: {
			name: "main",
		},
	},
	pipeline: {
		approvals: {
			preCdkSynth: {
				enable: true,
				email: "",
			},
		},
		removalPolicy: "retain",
		source: {
			repoBranch: "main",
			repoHook: {
				enable: false,
			},
			repoName: "document-translation",
			repoOwner: "aws-samples",
		},
	},
	app: {
		cognito: {
			localUsers: {
				enable: false,
				mfa: {
					enforcement: "off",
					otp: false,
					sms: false,
				},
			},
			saml: {
				enable: false,
				metadataUrl: "",
			},
		},
		readable: {
			enable: false,
			bedrockRegion: "us-east-1",
		},
		removalPolicy: "retain",
		translation: {
			enable: false,
			lifecycle: 7,
			pii: {
				enable: false,
				lifecycle: 3,
			},
		},
		webUi: {
			customDomain: {
				enable: false,
				domain: "",
				certificateArn: "",
			},
			enable: true,
		},
	},
};
