import { input } from "@inquirer/prompts";

export type samlUserOptions = {
	samlMetadataUrl?: string;
};

const showInstruction = () => {
	console.log(`
# Cognito SAML Configuration
Prerequisites: https://aws-samples.github.io/document-translation/docs/shared/prerequisites/saml-provider/
Post Install: https://aws-samples.github.io/document-translation/docs/shared/post-install/saml-provider/
	`);
};

export const getSamlUserOptions = async (): Promise<samlUserOptions> => {
	showInstruction();
	const theme = {
		prefix: "Shared Users: SAML:",
	};

	const answers: samlUserOptions = {
		samlMetadataUrl: await input({
			message: "Metadata URL (https://domain/...metadata.xml?appid=xxxx)",
			required: true,
			validate: (value) => {
				if (value.startsWith("https://")) {
					return true;
				}
				return "Invalid URL";
			},
			theme,
		}),
	};

	return answers;
};
