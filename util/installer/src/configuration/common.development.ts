import { confirm, select } from "@inquirer/prompts";
import { CommonDevelopmentOptions, removalPolicy } from "./options";
import { BOLD, RESET } from "../util/textStyles"

const showInstruction = () => {
	console.log(`
${BOLD}# Development Configuration${RESET}
Do not enable for non-development.
	`);
};

export const getCommonDevelopmentOptions =
	async (): Promise<CommonDevelopmentOptions> => {
		showInstruction();
		const theme = {
			prefix: "Development: ",
		};

		const removalPolicyOptons = [
			{
				name: "Delete",
				value: removalPolicy.DELETE,
			},
			{
				name: "Snapshot",
				value: removalPolicy.SNAPSHOT,
			},
			{
				name: "Retain",
				value: removalPolicy.RETAIN,
			},
		];

		const answers: CommonDevelopmentOptions = {
			common: {
				development: {
					enable: await confirm({
						message: "Enable (Do not enable for non-development)",
						default: false,
						theme,
					}),
				},
			},
			app: {
				removalPolicy: removalPolicy.RETAIN,
			},
			pipeline: {
				removalPolicy: removalPolicy.RETAIN,
			},
		};

		if (answers.common.development.enable) {
			answers.app.removalPolicy = await select({
				message: "App Removal Policy",
				choices: removalPolicyOptons,
				loop: false,
				pageSize: 20,
				default: removalPolicy.RETAIN,
				theme,
			});
			answers.pipeline.removalPolicy = await select({
				message: "Pipeline Removal Policy",
				choices: removalPolicyOptons,
				loop: false,
				pageSize: 20,
				default: removalPolicy.RETAIN,
				theme,
			});
		}

		return answers;
	};
