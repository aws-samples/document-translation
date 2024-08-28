import { input } from "@inquirer/prompts";

export type MiscOptions = {
	instanceName: string;
};

const showInstruction = () => {
	console.log(`
# Misc Configuration
	`);
};

export const getMiscOptions = async (): Promise<MiscOptions> => {
	showInstruction();

	const theme = {
		prefix: "Misc: ",
	};

	let answers: MiscOptions = {
		instanceName: await input({
			message: "Instance Name (branch from before v3.x.x)",
			required: true,
			default: "main",
			theme,
		}),
	};

	return answers;
};
