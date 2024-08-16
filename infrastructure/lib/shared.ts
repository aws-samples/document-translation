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
	readable: boolean;
	readableBedrockRegion: string;
	instanceName: string;
	sourceGitRepo: string;
	translation: boolean;
	translationLifecycleDefault: number;
	translationLifecyclePii: number;
	translationPii: boolean;
	webUi: boolean;
	webUiCustomDomain: string;
	webUiCustomDomainCertificate: string;
}

export function getSharedConfiguration(): SharedConfiguration {
	// Development
	const development = process.env.development?.toLowerCase() === "true";

	// Cognito
	const cognitoLocalUsers =
		process.env.cognitoLocalUsers?.toLowerCase() === "true";
	const cognitoLocalUsersMfa =
		process.env.cognitoLocalUsersMfa?.toLowerCase() || "off";
	const cognitoLocalUsersMfaOtp =
		process.env.cognitoLocalUsersMfaOtp?.toLowerCase() === "true";
	const cognitoLocalUsersMfaSms =
		process.env.cognitoLocalUsersMfaSms?.toLowerCase() === "true";
	const cognitoSamlUsers =
		process.env.cognitoSamlUsers?.toLowerCase() === "true";
	const cognitoSamlMetadataUrl = process.env.cognitoSamlMetadataUrl || "";

	// Translation
	const translation = process.env.translation?.toLowerCase() === "true";
	const translationPii = process.env.translationPii?.toLowerCase() === "true";
	const translationLifecycleDefault = parseInt(
		process.env.translationLifecycleDefault || "7",
	);
	const translationLifecyclePii = parseInt(
		process.env.translationLifecyclePii || "3",
	);

	// Readable
	const readable = process.env.readable?.toLowerCase() === "true";
	const readableBedrockRegion =
		process.env.readableBedrockRegion?.toLowerCase() || "";
	if (readable && !readableBedrockRegion) {
		throw new Error("readableBedrockRegion is required when readable is true");
	}

	// Web UI
	const webUi = process.env.webUi?.toLowerCase() === "true";
	const webUiCustomDomain = process.env.webUiCustomDomain?.toLowerCase() || "";
	const webUiCustomDomainCertificate =
		process.env.webUiCustomDomainCertificate || "";

	// Source
	const sourceGitRepo = process.env.sourceGitRepo || "";
	if (!sourceGitRepo) {
		throw new Error("sourceGitRepo is required");
	}
	const instanceName = process.env.instanceName || "main";

	// Removal
	const appRemovalPolicy = process.env.appRemovalPolicy?.toLowerCase() || "";
	const pipelineRemovalPolicy =
		process.env.pipelineRemovalPolicy?.toLowerCase() || "";

	return {
		appRemovalPolicy,
		cognitoLocalUsers,
		cognitoLocalUsersMfa,
		cognitoLocalUsersMfaOtp,
		cognitoLocalUsersMfaSms,
		cognitoSamlMetadataUrl,
		cognitoSamlUsers,
		development,
		pipelineRemovalPolicy,
		readable,
		readableBedrockRegion,
		instanceName,
		sourceGitRepo,
		translation,
		translationLifecycleDefault,
		translationLifecyclePii,
		translationPii,
		webUi,
		webUiCustomDomain,
		webUiCustomDomainCertificate,
	};
}
