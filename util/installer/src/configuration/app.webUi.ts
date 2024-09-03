import { input, confirm } from "@inquirer/prompts";
import { AppWebOptions } from "./options";

const showInstruction = () => {
	console.log(`
# Web UI Configuration
Prerequisites for custom domain name: https://aws-samples.github.io/document-translation/docs/shared/prerequisites/domain/
Post Install for custom domain name: https://aws-samples.github.io/document-translation/docs/shared/post-install/domain/
	`);
};

export const getAppWebOptions = async (): Promise<AppWebOptions> => {
	showInstruction();
	const theme = {
		prefix: "Shared Web: ",
	};

	const answers: AppWebOptions = {
		app: {
			webUi: {
				enable: await confirm({
					message: "Web UI",
					default: true,
					theme,
				}),
				customDomain: {
					enable: false,
					domain: "",
					certificateArn: "",
				},
			},
		},
	};

	if (answers.app.webUi.enable) {
		answers.app.webUi.customDomain.enable = await confirm({
			message: "Custom Domain",
			default: false,
			theme,
		});
	}

	if (answers.app.webUi.customDomain.enable) {
		answers.app.webUi.customDomain.domain = await input({
			message: "Custom Domain Name (doctran.example.com)",
			required: true,
			theme,
		});
		answers.app.webUi.customDomain.certificateArn = await input({
			message: "Custom Domain Certificate Arn (arn:aws:acm:...)",
			required: true,
			validate: (value) => {
				if (value.startsWith("arn:aws:acm:")) {
					return true;
				}
				return "Invalid ARN";
			},
			theme,
		});
	}

	return answers;
};
