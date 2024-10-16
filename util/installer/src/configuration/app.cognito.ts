import { checkbox } from "@inquirer/prompts";
import { AppCognitoOptions } from "./options";
import { BOLD, RESET } from "../util/textStyles"

const showInstruction = () => {
	console.log(`
${BOLD}# User Store Configuration${RESET}
At least 1 user store option must be selected.
For production SAML integration is recommended.
For test & development Local is recommended. 
	`);
};

export const getAppCognitoOptions = async (): Promise<AppCognitoOptions> => {
	showInstruction();
	const theme = {
		prefix: "Shared Users: ",
	};

	const selectedUserStores: string[] = await checkbox({
		message: "Select user stores",
		choices: [
			{ name: "Cognito Local", value: "cognito" },
			{ name: "Cognito SAML", value: "saml" },
		],
		required: true,
		loop: false,
		theme,
	});

	let answers: AppCognitoOptions = {
		app: {
			cognito: {
				localUsers: {
					enable: false,
				},
				saml: {
					enable: false,
				},
			},
		},
	};

	if (selectedUserStores.includes("cognito")) {
		answers.app.cognito.localUsers.enable = true;
	}

	if (selectedUserStores.includes("saml")) {
		answers.app.cognito.saml.enable = true;
	}

	return answers;
};
