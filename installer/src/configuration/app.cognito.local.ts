import { select, checkbox } from "@inquirer/prompts";
import { AppCognitoLocalOptions, cognitoMfaOption } from "./options";

const showInstruction = () => {
	console.log(`
# Cognito Local Configuration
Post Install: https://aws-samples.github.io/document-translation/docs/shared/post-install/cognito-first-user/
	`);
};

export const getAppCognitoLocalOptions =
	async (): Promise<AppCognitoLocalOptions> => {
		showInstruction();
		const theme = {
			prefix: "Shared Users: Local:",
		};

		const answers: AppCognitoLocalOptions = {
			app_cognito_localUsers_mfa_enforcement: await select({
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

		if (
			answers.app_cognito_localUsers_mfa_enforcement !== cognitoMfaOption.OFF
		) {
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

		answers.app_cognito_localUsers_mfa_otp = selectedMfaMethods.includes("otp");
		answers.app_cognito_localUsers_mfa_sms = selectedMfaMethods.includes("sms");

		return answers;
	};
