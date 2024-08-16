import { confirm, number } from "@inquirer/prompts";

export type translationOptions = {
	translation: boolean;
	translationLifecycleDefault?: number;
	translationPii?: boolean;
	translationLifecyclePii?: number;
};

const showInstruction = () => {
	console.log(`
# Translation Configuration
Prerequisites: https://aws-samples.github.io/document-translation/docs/translation/prerequisites/
	`);
};

export const getTranslationOptions = async (): Promise<translationOptions> => {
	showInstruction();
	const theme = {
		prefix: "Translation: ",
	};

	const answers: translationOptions = {
		translation: await confirm({
			message: "Enable",
			default: false,
			theme,
		}),
	};

	if (answers.translation) {
		answers.translationLifecycleDefault = await number({
			message: "Default file retention in days",
			default: 7,
			min: 1,
			max: 2147483647,
			required: true,
			theme,
		});
	}

	if (answers.translation) {
		answers.translationPii = await confirm({
			message: "Enable Pii Detection",
			default: false,
			theme,
		});
	}

	if (answers.translationPii) {
		answers.translationLifecyclePii = await number({
			message: "Pii file retention in days",
			default: 7,
			min: 1,
			max: 2147483647,
			required: true,
			theme,
		});
	}

	return answers;
};
