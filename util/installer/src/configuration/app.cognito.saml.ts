import { input } from "@inquirer/prompts";
import { AppCognitoSamlOptions } from "./options";
import { BOLD, RESET } from "../util/textStyles"

const showInstruction = () => {
	console.log(`
${BOLD}# Cognito SAML Configuration${RESET}
Prerequisites: https://aws-samples.github.io/document-translation/docs/shared/prerequisites/saml-provider/
Post Install: https://aws-samples.github.io/document-translation/docs/shared/post-install/saml-provider/
	`);
};

export const getAppCognitoSamlOptions =
	async (): Promise<AppCognitoSamlOptions> => {
		showInstruction();
		const theme = {
			prefix: "Shared Users: SAML:",
		};

		const answers: AppCognitoSamlOptions = {
			app: {
				cognito: {
					saml: {
						metadataUrl: await input({
							message:
								"Metadata URL (https://domain/...metadata.xml?appid=xxxx)",
							required: true,
							validate: (value) => {
								if (value.startsWith("https://")) {
									return true;
								}
								return "Invalid URL";
							},
							theme,
						}),
					},
				},
			},
		};

		return answers;
	};
