import { checkbox } from "@inquirer/prompts";

export type userOptions = {
	cognitoUsers: boolean;
	samlUsers: boolean;
};

const showInstruction = () => {
	console.log(`
# User Store Configuration
At least 1 user store option must be selected.
For production SAML integration is recommended.
For test & development Local is recommended. 
	`);
};

export const getUserOptions = async (): Promise<userOptions> => {
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

	let answers: userOptions = {
		cognitoUsers: false,
		samlUsers: false,
	};

	if (selectedUserStores.includes("cognito")) {
		answers.cognitoUsers = true;
	}

	if (selectedUserStores.includes("saml")) {
		answers.samlUsers = true;
	}

	return answers;
};
