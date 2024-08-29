import { confirm, select } from "@inquirer/prompts";
import { CommonDevelopmentOptions, removalPolicy } from "./options";

const showInstruction = () => {
	console.log(`
# Development Configuration
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
			common_development_enable: await confirm({
				message: "Enable (Do not enable for non-development)",
				default: false,
				theme,
			}),
		};

		if (answers.common_development_enable) {
			answers.app_removalPolicy = await select({
				message: "App Removal Policy",
				choices: removalPolicyOptons,
				loop: false,
				pageSize: 20,
				default: removalPolicy.RETAIN,
				theme,
			});
			answers.pipeline_removalPolicy = await select({
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
