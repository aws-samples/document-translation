import { input } from "@inquirer/prompts";
import { CommonMiscOptions } from "./options";

const theme = {
	prefix: "Common - Misc: ",
};

const showInstruction = () => {
	console.log(`
# Common - Misc Configuration
	`);
};

export const getCommonMiscOptions = async (): Promise<CommonMiscOptions> => {
	showInstruction();

	let answers: CommonMiscOptions = {
		common: {
			instance: {
				name: await input({
					message: "Instance Name (branch from before v3.x.x)",
					required: true,
					default: "main",
					theme,
				}),
			},
		},
	};

	return answers;
};
