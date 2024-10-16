import { confirm, select, Separator } from "@inquirer/prompts";
import { AppReadableOptions } from "./options";
import { BOLD, RESET } from "../util/textStyles"

const showInstruction = () => {
	console.log(`
${BOLD}# Readable Configuration${RESET}
Prerequisites: https://aws-samples.github.io/document-translation/docs/readable/prerequisites/
Post Install: https://aws-samples.github.io/document-translation/docs/readable/post-install/
	`);
};

export const getAppReadableOptions = async (): Promise<AppReadableOptions> => {
	showInstruction();
	const theme = {
		prefix: "Readable: ",
	};

	const regions = [
		new Separator("-- Europe --"),
		{
			value: "eu-central-1",
			name: "eu-central-1",
			description: "Europe (Frankfurt)",
		},
		{
			value: "eu-central-1",
			name: "eu-central-1",
			description: "Europe (Frankfurt)",
		},
		{ value: "eu-west-1", name: "eu-west-1", description: "Europe (Ireland)" },
		{ value: "eu-west-2", name: "eu-west-2", description: "Europe (London)" },
		{ value: "eu-west-3", name: "eu-west-3", description: "Europe (Paris)" },
		new Separator("-- Americas --"),
		{
			value: "ca-central-1",
			name: "ca-central-1",
			description: "Canada (Central)",
		},
		{
			value: "sa-east-1",
			name: "sa-east-1",
			description: "South America (São Paulo)",
		},
		{
			value: "us-east-1",
			name: "us-east-1",
			description: "US East (N. Virginia)",
		},
		{ value: "us-west-2", name: "us-west-2", description: "US West (Oregon)" },
		{
			value: "us-gov-west-1",
			name: "us-gov-west-1",
			description: "AWS GovCloud (US-West)",
		},
		new Separator("-- Asia --"),
		{
			value: "ap-northeast-1",
			name: "ap-northeast-1",
			description: "Asia Pacific (Tokyo)",
		},
		{
			value: "ap-south-1",
			name: "ap-south-1",
			description: "Asia Pacific (Mumbai)",
		},
		{
			value: "ap-southeast-2",
			name: "ap-southeast-2",
			description: "Asia Pacific (Sydney)",
		},
		{
			value: "ap-southwest-1",
			name: "ap-southwest-1",
			description: "Asia Pacific (Singapore)",
		},
	];

	const answers: AppReadableOptions = {
		app: {
			readable: {
				enable: await confirm({
					message: "Enable",
					default: false,
					theme,
				}),
			},
		},
	};

	if (answers.app.readable.enable) {
		answers.app.readable.bedrockRegion = await select({
			message: "Bedrock Region",
			choices: regions,
			loop: false,
			pageSize: 20,
			theme,
		});
	}

	return answers;
};
