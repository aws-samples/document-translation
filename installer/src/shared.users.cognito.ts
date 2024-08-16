import { select, checkbox } from "@inquirer/prompts";

export type cognitoUserOptions = {
	cognitoMfa?: cognitoMfaOption;
	cognitoMfaOtp?: boolean;
	cognitoMfaSms?: boolean;
};

export enum cognitoMfaOption {
	"OFF" = "OFF",
	"REQUIRED" = "REQUIRED",
	"OPTIONAL" = "OPTIONAL",
}

const showInstruction = () => {
	console.log(`
# Cognito Local Configuration
Post Install: https://aws-samples.github.io/document-translation/docs/shared/post-install/cognito-first-user/
	`);
};

export const getCognitoUserOptions = async (): Promise<cognitoUserOptions> => {
	showInstruction();
	const theme = {
		prefix: "Shared Users: Local:",
	};

	const answers: cognitoUserOptions = {
		cognitoMfa: await select({
			message: "Multi Factor Authentication",
			choices: [
				{
					value: cognitoMfaOption.OFF,
					name: "Off",
					description: "MFA is not enabled",
				},
				{
					value: cognitoMfaOption.OPTIONAL,
					name: "Optional",
					description: "MFA is optional",
				},
				{
					value: cognitoMfaOption.REQUIRED,
					name: "Required",
					description: "MFA is required",
				},
			],
			default: cognitoMfaOption.OFF,
			loop: false,
			pageSize: 20,
			theme,
		}),
	};

	let selectedMfaMethods: string[] = [];

	if (answers.cognitoMfa !== cognitoMfaOption.OFF) {
		selectedMfaMethods = await checkbox({
			message: "Select MFA Methods",
			choices: [
				{ name: "OTP", value: "otp" },
				{ name: "SMS", value: "sms" },
			],
			required: true,
			loop: false,
			theme,
		});
	}

	answers.cognitoMfaOtp = selectedMfaMethods.includes("otp");
	answers.cognitoMfaSms = selectedMfaMethods.includes("sms");

	return answers;
};
