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
			app_translation_enable: await confirm({
				message: "Enable",
				default: false,
				theme,
			}),
		};

		if (answers.app_translation_enable) {
			answers.app_translation_lifecycle = await number({
				message: "Default file retention in days",
				default: 7,
				min: 1,
				max: 2147483647,
				required: true,
				theme,
			});
		}

		if (answers.app_translation_enable) {
			answers.app_translation_pii_enable = await confirm({
				message: "Enable Pii Detection",
				default: false,
				theme,
			});
		}

		if (answers.app_translation_pii_enable) {
			answers.app_translation_pii_lifecycle = await number({
				message: "Pii file retention in days",
				default: 3,
				min: 1,
				max: answers.app_translation_lifecycle,
				required: true,
				theme,
			});
		}

		return answers;
	};
