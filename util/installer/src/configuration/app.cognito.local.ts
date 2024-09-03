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
			app: {
				cognito: {
					localUsers: {
						mfa: {
							enforcement: await select({
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
						},
					},
				},
			},
		};

		let selectedMfaMethods: string[] = [];

		if (
			answers.app.cognito.localUsers.mfa.enforcement !== cognitoMfaOption.OFF
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

		answers.app.cognito.localUsers.mfa.otp = selectedMfaMethods.includes("otp");
		answers.app.cognito.localUsers.mfa.sms = selectedMfaMethods.includes("sms");

		return answers;
	};
