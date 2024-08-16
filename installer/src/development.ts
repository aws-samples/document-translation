import { confirm, select } from "@inquirer/prompts";

enum removalPolicy {
	DELETE = "DELETE",
	SNAPSHOT = "SNAPSHOT",
	RETAIN = "RETAIN",
}

export type developmentOptions = {
	development: boolean;
	appRemovalPolicy?: string;
	pipelineRemovalPolicy?: string;
};

const showInstruction = () => {
	console.log(`
# Development Configuration
Do not enable for non-development.
	`);
};

export const getDevelopmentOptions = async (): Promise<developmentOptions> => {
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

	const answers: developmentOptions = {
		development: await confirm({
			message: "Enable (Do not enable for non-development)",
			default: false,
			theme,
		}),
	};

	if (answers.development) {
		answers.appRemovalPolicy = await select({
			message: "App Removal Policy",
			choices: removalPolicyOptons,
			loop: false,
			pageSize: 20,
			default: removalPolicy.RETAIN,
			theme,
		});
		answers.pipelineRemovalPolicy = await select({
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
