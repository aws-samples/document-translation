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
			email: string;
			enable: boolean;
		};
	};
	removalPolicy: string;
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
				enforcement: string;
				otp: boolean;
				sms: boolean;
			};
		};
		saml: {
			enable: boolean;
			metadataUrl: string;
		};
	};
	readable: {
		bedrockRegion: string;
		enable: boolean;
	};
	removalPolicy: string;
	translation: {
		enable: boolean;
		lifecycle: number;
		pii: {
			enable: boolean;
			lifecycle: number;
		};
	};
	webUi: {
		customDomain: {
			certificateArn: string;
			enable: boolean;
			domain: string;
		};
		enable: boolean;
	};
};

export type Config = {
	common: CommonConfig;
	pipeline: PipelineConfig;
	app: AppConfig;
};
