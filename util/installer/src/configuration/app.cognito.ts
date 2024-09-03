import { checkbox } from "@inquirer/prompts";
import { AppCognitoOptions } from "./options";

const showInstruction = () => {
	console.log(`
# User Store Configuration
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
		app_cognito_localUsers_enable: false,
		app_cognito_saml_enable: false,
	};

	if (selectedUserStores.includes("cognito")) {
		answers.app_cognito_localUsers_enable = true;
	}

	if (selectedUserStores.includes("saml")) {
		answers.app_cognito_saml_enable = true;
	}

	return answers;
};
