import { confirm, number } from "@inquirer/prompts";

import { AppTranslationOptions } from "./options";

const showInstruction = () => {
	console.log(`
# Translation Configuration
Prerequisites: https://aws-samples.github.io/document-translation/docs/translation/prerequisites/
	`);
};

export const getAppTranslationOptions =
	async (): Promise<AppTranslationOptions> => {
		showInstruction();
		const theme = {
			prefix: "Translation: ",
		};

		const answers: AppTranslationOptions = {
			app: {
				translation: {
					enable: await confirm({
						message: "Enable",
						default: false,
						theme,
					}),
					lifecycle: 7,
					pii: {
						enable: false,
						lifecycle: 3,
					},
				},
			},
		};

		if (answers.app.translation.enable) {
			answers.app.translation.lifecycle = await number({
				message: "Default file retention in days",
				default: 7,
				min: 1,
				max: 2147483647,
				required: true,
				theme,
			});
		}

		if (answers.app.translation.enable) {
			answers.app.translation.pii.enable = await confirm({
				message: "Enable Pii Detection",
				default: false,
				theme,
			});
		}

		if (answers.app.translation.pii.enable) {
			answers.app.translation.pii.lifecycle = await number({
				message: "Pii file retention in days",
				default: 3,
				min: 1,
				max: answers.app.translation.lifecycle,
				required: true,
				theme,
			});
		}

		return answers;
	};
